// ============================================================
// Chat Widget – Shared TypeScript Types
// ============================================================

export interface ChatContact {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string; // ISO string or formatted
  unreadCount?: number;
}

// Bug Fix #3: The backend's ChatMessageDto.timestamp is LocalDateTime.
// Without Jackson's write-dates-as-timestamps=false config on the server,
// this serializes as a JSON array [year, month, day, hour, minute, second]
// rather than an ISO string.  We widen the type to accept both, and use the
// parseTimestamp() utility (in chatApi.ts) to normalise it everywhere.
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string | number[]; // ISO string OR [y, m, d, h, min, sec] array
  isRead?: boolean;
}

export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
}

export type ChatView = "inbox" | "active";
