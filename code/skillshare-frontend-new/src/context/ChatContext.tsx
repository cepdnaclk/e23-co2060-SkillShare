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

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"inbox" | "chat">("inbox");
  const [inbox, setInbox] = useState<RecentChat[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
    if (!token || !userRef.current) return;

    chatSocketService.connect(token);

    const unsubMsg = chatSocketService.onMessage((dto: ChatMessageDto) => {
      if (dto.senderId === userRef.current?.id) {
        // Use the same saved timestamp as the receiver and subsequent history loads.
        setActiveConversation((prev) => {
          if (!prev || prev.contactId !== dto.receiverId) return prev;
          const saved: ChatHistoryMessage = {
            id: dto.id ?? dto.clientMessageId ?? crypto.randomUUID(),
            senderId: dto.senderId,
            receiverId: dto.receiverId,
            content: dto.content,
            timestamp: dto.timestamp,
            isRead: false,
          };
          const index = prev.messages.findIndex(
            (message) => message.id === dto.clientMessageId || message.id === dto.id
          );
          const messages = [...prev.messages];
          if (index >= 0) messages[index] = { ...saved, isRead: messages[index].isRead };
          else messages.push(saved);
          return { ...prev, messages };
        });
        refreshInbox();
        return;
      }
      const incomingId = dto.senderId as string;

      // Is the user actively looking at this exact conversation right now?
      const activeConv = activeConversationRef.current;
      const isViewingThisContact =
        isOpenRef.current && viewRef.current === "chat" && activeConv?.contactId === incomingId;

      const newMsgId = dto.id ?? crypto.randomUUID();

      // Append to active conversation if it matches
      setActiveConversation((prev) => {
        if (!prev || prev.contactId !== incomingId) return prev;
        const newMsg: ChatHistoryMessage = {
          id: newMsgId,
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
            // Revert the local message to unread if the server fails to mark it read
            setActiveConversation((prev) => {
              if (!prev || prev.contactId !== incomingId) return prev;
              return {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === newMsgId ? { ...m, isRead: false } : m
                ),
              };
            });
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

      const clientMessageId = crypto.randomUUID();
      const dto: ChatMessageRequest = {
        clientMessageId,
        senderId: user.id,
        receiverId: activeConversation.contactId,
        content: content.trim(),
      };

      // Optimistic update — append to local state immediately
      const optimisticMsg: ChatHistoryMessage = {
        id: clientMessageId,
        senderId: user.id,
        receiverId: activeConversation.contactId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
      );

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
