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

export const chatApi = {
  /** Fetch total unread message count for the FAB badge */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await axios.get<{ count: number }>(
      `${BASE_URL}/api/chat/unread-count`,
      { headers: authHeaders() }
    );
    return data.count ?? 0;
  },

  /** Fetch list of recent conversations for the Inbox view */
  getRecentConversations: async (): Promise<ChatContact[]> => {
    const { data } = await axios.get<ChatContact[]>(
      `${BASE_URL}/api/chat/recent`,
      { headers: authHeaders() }
    );
    return data;
  },

  /** Fetch full chat history between current user and contactId */
  getChatHistory: async (contactId: string): Promise<ChatMessage[]> => {
    const { data } = await axios.get<ChatMessage[]>(
      `${BASE_URL}/api/chat/history/${contactId}`,
      { headers: authHeaders() }
    );
    return data;
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
