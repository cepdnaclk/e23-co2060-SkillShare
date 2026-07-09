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
import { chatApi, type RecentChat, type ChatHistoryMessage, type ChatMessageDto } from "@/lib/chatApi";
import { chatSocketService } from "@/services/chatSocketService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveConversation {
  contactId: string;
  contactName: string;
  contactPicture: string | null;
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

  // ── Connect WebSocket when user is logged in ─────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    chatSocketService.connect(token);

    const unsubMsg = chatSocketService.onMessage((dto: ChatMessageDto) => {
      const incomingId = dto.senderId as string;

      // Append to active conversation if it matches
      setActiveConversation((prev) => {
        if (!prev || prev.contactId !== incomingId) return prev;
        const newMsg: ChatHistoryMessage = {
          id: crypto.randomUUID(),
          sender: { id: dto.senderId as string, fullName: "", email: "" },
          receiver: { id: dto.receiverId as string, fullName: "", email: "" },
          content: dto.content,
          timestamp: dto.timestamp ?? new Date().toISOString(),
          read: true,
        };
        return { ...prev, messages: [...prev.messages, newMsg] };
      });

      // Refresh the inbox for snippet + unread badge update
      refreshInbox();
    });

    const unsubTyping = chatSocketService.onTyping((status) => {
      setActiveConversation((prev) => {
        if (!prev || prev.contactId !== (status.senderId as string)) return prev;
        return { ...prev, isTyping: status.typing };
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
  }, [token, user]);

  // ── Fetch inbox on mount ─────────────────────────────────────────────────
  const refreshInbox = useCallback(async () => {
    if (!user) return;
    setIsLoadingInbox(true);
    try {
      const [chats, count] = await Promise.all([
        chatApi.getRecentChats(),
        chatApi.getUnreadCount(),
      ]);
      setInbox(chats);
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

      const dto: ChatMessageDto = {
        senderId: user.id,
        receiverId: activeConversation.contactId,
        content: content.trim(),
      };

      // Optimistic update — append to local state immediately
      const optimisticMsg: ChatHistoryMessage = {
        id: crypto.randomUUID(),
        sender: { id: user.id, fullName: user.fullName, email: user.email },
        receiver: { id: activeConversation.contactId, fullName: activeConversation.contactName, email: "" },
        content: content.trim(),
        timestamp: new Date().toISOString(),
        read: true,
      };
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
      );

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
