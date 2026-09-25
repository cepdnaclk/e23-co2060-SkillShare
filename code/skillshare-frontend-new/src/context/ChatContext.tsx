import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/api/chat.api";
import type { RecentChatDto as RecentChat, ChatMessageResponse as ChatHistoryMessage, ChatMessageDto, ChatMessageRequest } from "@/api/types";
import { chatSocketService } from "@/services/chatSocketService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveConversation {
  contactId: string;
  contactName: string;
  contactPicture: string | null;
  // Full contact record as received from the inbox/contact list. Kept around
  // so we can re-insert it into the inbox after sending a message, without
  // waiting on (and racing) a server refetch. This is what lets a
  // conversation with someone who isn't a friend/existing contact yet
  // survive being closed and reopened.
  contact: RecentChat;
  messages: ChatHistoryMessage[];
  isLoadingHistory: boolean;
  isTyping: boolean;
}

interface ChatContextType {
  isOpen: boolean;
  view: "inbox" | "chat";
  inbox: RecentChat[];
  totalUnread: number;
  isLoadingInbox: boolean;
  activeConversation: ActiveConversation | null;
  openWidget: () => void;
  closeWidget: () => void;
  openChat: (contact: RecentChat) => void;
  backToInbox: () => void;
  sendMessage: (content: string) => void;
  refreshInbox: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();

  console.warn("[ChatProvider] Rendered. User present:", !!user, "Token present:", !!token);

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"inbox" | "chat">("inbox");
  const [inbox, setInbox] = useState<RecentChat[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contacts we've locally added/bumped to the inbox (e.g. right after
  // sending a message) that the server hasn't confirmed yet via
  // getRecentChats(). refreshInbox() keeps these around until the server
  // response actually includes them, so a just-started conversation never
  // silently disappears because of a race with backend persistence — or
  // because the "recent chats" endpoint doesn't (yet) know about a contact
  // who isn't an existing friend/connection.
  const optimisticInboxRef = useRef<Map<string, RecentChat>>(new Map());

  // Use a ref for the user object to avoid triggering reconnect cleanup cycles when user profile updates
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Refs mirroring state that the WebSocket handlers need to read live,
  // without forcing the socket effect below to reconnect on every change.
  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // ── Connect WebSocket when user is logged in ─────────────────────────────
  useEffect(() => {
    console.warn("[ChatProvider] useEffect triggered. Token:", token ? "Exists" : "Null");
    if (!token || !userRef.current) return;

    console.warn("[ChatProvider] Initiating WebSocket connection...");
    chatSocketService.connect(token);

    const unsubMsg = chatSocketService.onMessage((dto: ChatMessageDto) => {
      const incomingId = dto.senderId as string;

      // Is the user actively looking at this exact conversation right now?
      const activeConv = activeConversationRef.current;
      const isViewingThisContact =
        isOpenRef.current && viewRef.current === "chat" && activeConv?.contactId === incomingId;

      // Append to active conversation if it matches
      setActiveConversation((prev) => {
        if (!prev || prev.contactId !== incomingId) return prev;
        const newMsg: ChatHistoryMessage = {
          id: crypto.randomUUID(),
          senderId: dto.senderId as string,
          receiverId: dto.receiverId as string,
          content: dto.content,
          timestamp: dto.timestamp ?? new Date().toISOString(),
          // Only true if we're actually about to mark it read server-side —
          // otherwise this falsely flags an unseen message as read locally.
          isRead: isViewingThisContact,
        };
        return { ...prev, messages: [...prev.messages, newMsg] };
      });

      if (isViewingThisContact) {
        // If the conversation is open and visible, mark the message read on
        // the server, and only refresh the inbox AFTER that call settles.
        // Previously refreshInbox() ran unconditionally on the next line,
        // right after firing markAsRead without awaiting it — the inbox
        // fetch would win the race and return the pre-read unread count.
        // That stale count then stuck around (nothing re-fetched it after),
        // which is why closing the chat still showed it as unread.
        chatApi
          .markAsRead(incomingId)
          .catch(() => {
            // silent — worst case the badge is briefly stale
          })
          .finally(() => {
            refreshInbox();
          });
      } else {
        // Not viewing this contact right now — genuinely unread, refresh
        // immediately so the badge/snippet update.
        refreshInbox();
      }
    });

    const unsubTyping = chatSocketService.onTyping((status) => {
      setActiveConversation((prev) => {
        if (!prev || prev.contactId !== (status.senderId as string)) return prev;
        return { ...prev, isTyping: status.isTyping };
      });

      // Auto-clear typing indicator after 3 s as a safety net
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setActiveConversation((prev) => (prev ? { ...prev, isTyping: false } : prev));
      }, 3000);
    });

    return () => {
      console.warn("[ChatProvider] Cleaning up WebSocket connection...");
      unsubMsg();
      unsubTyping();
      chatSocketService.disconnect();
    };
  }, [token, user?.id]);

  // ── Fetch inbox on mount ─────────────────────────────────────────────────
  const refreshInbox = useCallback(async () => {
    if (!user) return;
    setIsLoadingInbox(true);
    try {
      const [chats, count] = await Promise.all([
        chatApi.getRecentChats(),
        chatApi.getUnreadCount(),
      ]);

      // Reconcile with any optimistic entries: drop the ones the server has
      // now caught up with, and keep (prepended) any it hasn't — including
      // contacts the "recent chats" endpoint may never return because they
      // aren't a friend/connection. This is what stops a conversation from
      // vanishing after you send a message and back out of it.
      const serverIds = new Set(chats.map((c) => c.contactId));
      for (const id of optimisticInboxRef.current.keys()) {
        if (serverIds.has(id)) optimisticInboxRef.current.delete(id);
      }
      const stillPending = Array.from(optimisticInboxRef.current.values());

      setInbox([...stillPending, ...chats]);
      setTotalUnread(count);
    } catch {
      // silent — badge simply won't update
    } finally {
      setIsLoadingInbox(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshInbox();
  }, [user, refreshInbox]);

  // ── Widget controls ──────────────────────────────────────────────────────
  const openWidget = useCallback(() => {
    setIsOpen(true);
    refreshInbox();
  }, [refreshInbox]);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setView("inbox");
  }, []);

  const openChat = useCallback(async (contact: RecentChat) => {
    setView("chat");
    setActiveConversation({
      contactId: contact.contactId,
      contactName: contact.contactName,
      contactPicture: contact.contactProfilePicture,
      contact,
      messages: [],
      isLoadingHistory: true,
      isTyping: false,
    });

    // Mark as read immediately, then fetch history
    try {
      await chatApi.markAsRead(contact.contactId);
      const page = await chatApi.getHistory(contact.contactId);
      const sorted = [...page.content].reverse(); // API returns DESC, UI needs ASC
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: sorted, isLoadingHistory: false } : prev
      );
      // Refresh inbox so unread badge clears
      refreshInbox();
    } catch {
      setActiveConversation((prev) =>
        prev ? { ...prev, isLoadingHistory: false } : prev
      );
    }
  }, [refreshInbox]);

  const backToInbox = useCallback(() => {
    setView("inbox");
    setActiveConversation(null);
    refreshInbox();
  }, [refreshInbox]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!user || !activeConversation || !content.trim()) return;

      const dto: ChatMessageRequest = {
        senderId: user.id,
        receiverId: activeConversation.contactId,
        content: content.trim(),
      };

      // Optimistic update — append to local state immediately
      const optimisticMsg: ChatHistoryMessage = {
        id: crypto.randomUUID(),
        senderId: user.id,
        receiverId: activeConversation.contactId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
      );

      // Keep this contact pinned in the inbox (bumped to the top) the
      // moment we send to them — whether or not they were already there,
      // and whether or not they're a friend/connection. Without this, a
      // brand-new or non-friend contact could be wiped out by the next
      // refreshInbox() if the server hasn't persisted/indexed the message
      // yet (or never surfaces non-friends from getRecentChats() at all).
      optimisticInboxRef.current.set(activeConversation.contactId, activeConversation.contact);
      setInbox((prev) => [
        activeConversation.contact,
        ...prev.filter((c) => c.contactId !== activeConversation.contactId),
      ]);

      // Publish over WebSocket
      chatSocketService.sendMessage(dto);
    },
    [user, activeConversation]
  );

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        view,
        inbox,
        totalUnread,
        isLoadingInbox,
        activeConversation,
        openWidget,
        closeWidget,
        openChat,
        backToInbox,
        sendMessage,
        refreshInbox,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
