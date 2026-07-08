// ============================================================
// Chat Widget – REST API helpers (axios)
// ============================================================

import axios from "axios";
import { getToken } from "@/lib/auth";
import type { ChatContact, ChatMessage } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function authHeaders() {
  const token = getToken();
  return { Authorization: `Bearer ${token}` };
}

// ── Timestamp Normalizer ─────────────────────────────────────
// After the backend fix (write-dates-as-timestamps=false + @JsonFormat),
// timestamps arrive as "2024-01-15T10:30:05". This utility still handles
// the legacy array format [y,m,d,h,min,sec] as a fallback so the app
// doesn't break if the backend is temporarily in the old state.
export function parseTimestamp(ts: string | number[] | null | undefined): string {
  if (!ts) return new Date().toISOString();

  if (Array.isArray(ts)) {
    // Java: month is 1-indexed; JS Date: month is 0-indexed
    const [year, month, day, hour = 0, minute = 0, second = 0] = ts;
    return new Date(year, month - 1, day, hour, minute, second).toISOString();
  }

  return ts;
}

// ── Contact Normalizer ───────────────────────────────────────
// Backend RecentChatDto fields: contactId, contactName, contactProfilePicture,
// lastMessage, lastMessageTime, unreadCount.
// Frontend ChatContact fields:  id,        name,        avatarUrl,
//                               lastMessage, lastMessageTime, unreadCount.
function normalizeContact(raw: Record<string, unknown>): ChatContact {
  return {
    id: String(raw.contactId ?? raw.id ?? ""),
    name: String(raw.contactName ?? raw.name ?? "Unknown"),
    avatarUrl: (raw.contactProfilePicture ?? raw.avatarUrl) as string | undefined,
    lastMessage: String(raw.lastMessage ?? ""),
    lastMessageTime: parseTimestamp(
      raw.lastMessageTime as string | number[] | null
    ),
    unreadCount: Number(raw.unreadCount ?? 0),
  };
}

// ── Chat Message Normalizer ──────────────────────────────────
// After the backend fix, history returns flat ChatMessageDto:
//   { id, senderId, receiverId, content, timestamp, isRead }
// The WebSocket push also sends ChatMessageDto with the same shape.
// This normalizer handles both, plus the legacy nested-entity shape for safety.
export function normalizeChatMessage(raw: Record<string, unknown>): ChatMessage {
  // --- Flat DTO shape (expected from fixed backend) ---
  if (raw.senderId !== undefined && typeof raw.senderId !== "object") {
    return {
      id: String(raw.id ?? `msg-${Date.now()}-${Math.random()}`),
      senderId: String(raw.senderId),
      receiverId: String(raw.receiverId ?? ""),
      content: String(raw.content ?? ""),
      timestamp: parseTimestamp(raw.timestamp as string | number[] | null),
      isRead: Boolean(raw.isRead ?? raw.read ?? false),
    };
  }

  // --- Legacy nested-entity shape (pre-fix backend) ---
  // { sender: { id: "...", ... }, receiver: { id: "...", ... }, ... }
  const sender = raw.sender as Record<string, unknown> | undefined;
  const receiver = raw.receiver as Record<string, unknown> | undefined;

  return {
    id: String(raw.id ?? `msg-${Date.now()}-${Math.random()}`),
    senderId: String(sender?.id ?? raw.senderId ?? ""),
    receiverId: String(receiver?.id ?? raw.receiverId ?? ""),
    content: String(raw.content ?? ""),
    timestamp: parseTimestamp(raw.timestamp as string | number[] | null),
    isRead: Boolean(raw.isRead ?? raw.read ?? false),
  };
}

// ── API Methods ──────────────────────────────────────────────
export const chatApi = {
  /** Fetch total unread message count for the FAB badge */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await axios.get<{ unreadCount: number }>(
      `${BASE_URL}/api/chat/unread-count`,
      { headers: authHeaders() }
    );
    return data.unreadCount ?? 0;
  },

  /** Fetch list of recent conversations for the Inbox view */
  getRecentConversations: async (): Promise<ChatContact[]> => {
    const { data } = await axios.get<Record<string, unknown>[]>(
      `${BASE_URL}/api/chat/recent`,
      { headers: authHeaders() }
    );
    return data.map(normalizeContact);
  },

  /** Fetch full chat history between current user and contactId */
  getChatHistory: async (contactId: string): Promise<ChatMessage[]> => {
    const { data } = await axios.get<Record<string, unknown>[]>(
      `${BASE_URL}/api/chat/history/${contactId}`,
      { headers: authHeaders() }
    );
    return data.map(normalizeChatMessage);
  },

  /** Silently mark all messages from contactId as read */
  markAsRead: async (contactId: string): Promise<void> => {
    await axios.put(
      `${BASE_URL}/api/chat/mark-read/${contactId}`,
      {},
      { headers: authHeaders() }
    );
  },
};
