import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { RecentChatDto, ChatMessageResponse, Page } from "./types";

export const chatApi = {
  getRecentChats: () =>
    apiFetch<RecentChatDto[]>(API_ROUTES.CHAT_RECENT),

  getHistory: (contactId: string, page = 0, size = 50) =>
    apiFetch<Page<ChatMessageResponse>>(`${API_ROUTES.chatHistoryByContactId(contactId)}?page=${page}&size=${size}`),

  markAsRead: (contactId: string) =>
    apiFetch<void>(API_ROUTES.markChatRead(contactId), { method: "PUT" }),

  getUnreadCount: () =>
    apiFetch<{ unreadCount: number }>(API_ROUTES.CHAT_UNREAD_COUNT).then(
      (r) => r.unreadCount
    ),
};
