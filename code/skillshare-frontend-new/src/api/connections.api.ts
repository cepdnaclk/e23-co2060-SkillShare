import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { ConnectionDto } from "./types";

export const connectionsApi = {
  getStatus: (userId: string) =>
    apiFetch<{ status: string; connectionId: string | null }>(API_ROUTES.connectionStatusByUserId(userId)),

  sendRequest: (userId: string) =>
    apiFetch<{ status: string; message: string }>(API_ROUTES.requestConnection(userId), { method: "POST" }),

  acceptRequest: (connectionId: string) =>
    apiFetch<{ status: string; message: string }>(API_ROUTES.acceptConnection(connectionId), { method: "PUT" }),

  rejectRequest: (connectionId: string) =>
    apiFetch<{ status: string; message: string }>(API_ROUTES.rejectConnection(connectionId), { method: "DELETE" }),

  deleteConnection: (connectionId: string) =>
    apiFetch<{ status: string; message: string }>(`/api/connections/${connectionId}`, { method: "DELETE" }),

  getFriends: () =>
    apiFetch<ConnectionDto[]>(API_ROUTES.CONNECTIONS_FRIENDS),

  getPending: () =>
    apiFetch<ConnectionDto[]>(API_ROUTES.CONNECTIONS_PENDING),
};
