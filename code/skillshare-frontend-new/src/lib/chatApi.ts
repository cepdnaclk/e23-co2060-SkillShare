import { getToken } from "@/lib/auth";

const BASE_URL = import.meta.env.VITE_API_URL as string;

// ─── TypeScript interfaces matching the backend DTOs ─────────────────────────

export interface RecentChat {
  contactId: string;
  contactName: string;
  contactProfilePicture: string | null;
  lastMessage: string;
  lastMessageTime: string | null;
  unreadCount: number;
}

export interface ChatHistoryMessage {
  id: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
    profilePictureUrl?: string;
  };
  receiver: {
    id: string;
    fullName: string;
    email: string;
    profilePictureUrl?: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
}

export interface ChatPage {
  content: ChatHistoryMessage[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface ChatMessageDto {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: string;
}

export interface TypingStatusDto {
  senderId: string;
  receiverId: string;
  isTyping: boolean;
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function chatFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const msg = isJson
      ? (await res.json().catch(() => ({}))).message ?? `Error ${res.status}`
      : await res.text().catch(() => `Error ${res.status}`);
    throw new Error(msg);
  }
  return isJson ? (res.json() as Promise<T>) : (res.text() as unknown as T);
}

// ─── Chat REST API surface ────────────────────────────────────────────────────

export const chatApi = {
  /** Inbox: list of recent conversations with snippet, timestamp, unread count */
  getRecentChats: (): Promise<RecentChat[]> =>
    chatFetch<RecentChat[]>("/api/chat/recent"),

  /** Paginated message history between the current user and contactId */
  getHistory: (contactId: string, page = 0, size = 50): Promise<ChatPage> =>
    chatFetch<ChatPage>(`/api/chat/history/${contactId}?page=${page}&size=${size}`),

  /** Mark all messages from contactId as read */
  markAsRead: (contactId: string): Promise<void> =>
    chatFetch<void>(`/api/chat/mark-read/${contactId}`, { method: "PUT" }),

  /** Global unread message count for the notification badge */
  getUnreadCount: (): Promise<number> =>
    chatFetch<{ unreadCount: number }>("/api/chat/unread-count").then(
      (r) => r.unreadCount
    ),
};
