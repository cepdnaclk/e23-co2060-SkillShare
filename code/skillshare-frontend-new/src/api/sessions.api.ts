import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type {
  SessionRequest,
  SessionResponse,
  SessionStatus,
} from "./types";

export const sessionsApi = {
  // ============================================================
  // BOOK INDIVIDUAL / GROUP SESSION
  // ============================================================

  book: (
    skillId: string,
    availabilityId: string,
    sessionType: "INDIVIDUAL" | "GROUP" = "INDIVIDUAL",
    capacity?: number
  ) =>
    apiFetch<SessionResponse>(
      API_ROUTES.SESSIONS_BOOK,
      {
        method: "POST",
        body: JSON.stringify({
          skillId,
          availabilityId,
          sessionType,
          capacity,
        } as SessionRequest),
      }
    ),

  // ============================================================
  // CREATE GROUP SESSION
  // ============================================================
  //
  // IMPORTANT:
  // The backend does NOT have:
  // POST /api/sessions/groups
  //
  // Group creation is handled by:
  // POST /api/sessions/book
  //
  // with:
  // sessionType = "GROUP"
  //
  // capacity must be between 2 and 5.
  //
  createGroup: (
    skillId: string,
    availabilityId: string,
    capacity: number
  ) =>
    apiFetch<SessionResponse>(
      API_ROUTES.SESSIONS_BOOK,
      {
        method: "POST",
        body: JSON.stringify({
          skillId,
          availabilityId,
          sessionType: "GROUP",
          capacity,
        } as SessionRequest),
      }
    ),

  // ============================================================
  // GROUP SESSION LISTS
  // ============================================================

  // Get open group sessions
  getGroups: () =>
    apiFetch<SessionResponse[]>(
      API_ROUTES.SESSIONS_GROUPS
    ),

  // Get group sessions belonging to / involving current user
  getMyGroups: () =>
    apiFetch<SessionResponse[]>(
      API_ROUTES.SESSIONS_MY_GROUPS
    ),

  // Explore available group sessions
  exploreGroups: () =>
    apiFetch<SessionResponse[]>(
      API_ROUTES.SESSIONS_EXPLORE_GROUPS
    ),

  // ============================================================
  // SINGLE GROUP SESSION
  // ============================================================

  getGroup: (sessionId: string) =>
    apiFetch<SessionResponse>(
      API_ROUTES.groupSessionById(sessionId)
    ),

  // ============================================================
  // GROUP PARTICIPATION
  // ============================================================

  // Learner requests to join a group
  joinGroup: (sessionId: string) =>
    apiFetch<SessionResponse>(
      API_ROUTES.joinGroupSession(sessionId),
      {
        method: "POST",
      }
    ),

  // Learner declines an invitation
  declineGroup: (sessionId: string) =>
    apiFetch<SessionResponse>(
      API_ROUTES.declineGroupInvitation(sessionId),
      {
        method: "POST",
      }
    ),

  // Learner leaves a group
  leaveGroup: (sessionId: string) =>
    apiFetch<SessionResponse>(
      API_ROUTES.leaveGroupSession(sessionId),
      {
        method: "POST",
      }
    ),

  // Mentor removes a participant
  removeParticipant: (
    sessionId: string,
    userId: string
  ) =>
    apiFetch<SessionResponse>(
      API_ROUTES.removeGroupParticipant(
        sessionId,
        userId
      ),
      {
        method: "DELETE",
      }
    ),

  // Invite a learner to a group
  inviteParticipant: (
    sessionId: string,
    userId: string
  ) =>
    apiFetch<SessionResponse>(
      API_ROUTES.inviteToGroupSession(
        sessionId,
        userId
      ),
      {
        method: "POST",
      }
    ),

  // Mentor accepts a learner's join request
  acceptParticipant: (
    sessionId: string,
    userId: string
  ) =>
    apiFetch<SessionResponse>(
      `${API_ROUTES.updateGroupParticipantStatus(
        sessionId,
        userId
      )}?status=JOINED`,
      {
        method: "PATCH",
      }
    ),

  // ============================================================
  // SESSION STATUS
  // ============================================================

  updateStatus: (
    sessionId: string,
    status: SessionStatus
  ) =>
    apiFetch<SessionResponse>(
      `${API_ROUTES.updateSessionStatus(
        sessionId
      )}?status=${status}`,
      {
        method: "PATCH",
      }
    ),

  // ============================================================
  // COMPLETE SESSION
  // ============================================================

  complete: (sessionId: string) =>
    apiFetch<SessionResponse>(
      API_ROUTES.completeSession(sessionId),
      {
        method: "PATCH",
      }
    ),

  // ============================================================
  // CANCEL SESSION
  // ============================================================

  cancel: (sessionId: string) =>
    apiFetch<SessionResponse>(
      API_ROUTES.cancelSession(sessionId),
      {
        method: "PUT",
      }
    ),

  // ============================================================
  // LEARNER / MENTOR SESSIONS
  // ============================================================

  getLearnerSessions: (userId: string) =>
    apiFetch<SessionResponse[]>(
      API_ROUTES.learnerSessionsByUserId(userId)
    ),

  getMentorSessions: (userId: string) =>
    apiFetch<SessionResponse[]>(
      API_ROUTES.mentorSessionsByUserId(userId)
    ),

  // ============================================================
  // MEETING LINK
  // ============================================================

  addMeetingLink: (
    sessionId: string,
    meetingLink: string
  ) =>
    apiFetch<SessionResponse>(
      API_ROUTES.addMeetingLink(sessionId),
      {
        method: "PATCH",
        body: JSON.stringify({
          meetingLink,
        }),
      }
    ),
};