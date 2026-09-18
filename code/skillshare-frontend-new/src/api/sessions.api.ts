import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { SessionRequest, SessionResponse } from "./types";
import type { SessionStatus } from "./types";

export const sessionsApi = {
  book: (skillId: string, availabilityId: string) =>
    apiFetch<SessionResponse>(API_ROUTES.SESSIONS_BOOK, {
      method: "POST",
      body: JSON.stringify({ skillId, availabilityId } as SessionRequest),
    }),

  updateStatus: (sessionId: string, status: SessionStatus) =>
    apiFetch<SessionResponse>(`${API_ROUTES.updateSessionStatus(sessionId)}?status=${status}`, {
      method: "PATCH",
    }),

  complete: (sessionId: string) =>
    apiFetch<SessionResponse>(API_ROUTES.completeSession(sessionId), { method: "PATCH" }),

  cancel: (sessionId: string) =>
    apiFetch<SessionResponse>(API_ROUTES.cancelSession(sessionId), { method: "PUT" }),

  getLearnerSessions: (userId: string) =>
    apiFetch<SessionResponse[]>(API_ROUTES.learnerSessionsByUserId(userId)),

  getMentorSessions: (userId: string) =>
    apiFetch<SessionResponse[]>(API_ROUTES.mentorSessionsByUserId(userId)),

  addMeetingLink: (sessionId: string, meetingLink: string) =>
    apiFetch<SessionResponse>(API_ROUTES.addMeetingLink(sessionId), {
      method: "PATCH",
      body: JSON.stringify({ meetingLink }), // NOTE: Expected as string or JSON? Contract says @RequestBody String meetingLink for older but wait, let's keep it as is.
    }),
};
