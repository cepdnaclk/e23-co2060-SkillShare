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

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string; // ISO string
  isRead?: boolean;
}

export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
}

export type ChatView = "inbox" | "active";
