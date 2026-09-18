import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { Notification } from "./types";

export const notificationsApi = {
  getInbox: () =>
    apiFetch<Notification[]>(API_ROUTES.NOTIFICATIONS_MY_INBOX),

  getUnreadCount: () =>
    apiFetch<number>(API_ROUTES.NOTIFICATIONS_UNREAD_COUNT),

  markAsRead: (notificationId: string) =>
    apiFetch<string>(API_ROUTES.markNotificationRead(notificationId), { method: "PUT" }),
};
