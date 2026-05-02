// ============================================================
// Central API Client — auto-injects JWT, parses errors uniformly
// ============================================================

const BASE_URL = "http://localhost:8080";

// Shape of the backend's GlobalExceptionHandler error response
export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Core fetch wrapper.
 * - Attaches Authorization header automatically for authenticated requests
 * - Parses JSON errors from the backend and throws them as ApiError
 */
async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    skipAuth = false
): Promise<T> {
  const token = localStorage.getItem("skillshare_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (!skipAuth && token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle no-content responses
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    if (isJson) {
      try {
        const errBody = await response.json();
        errorMessage = errBody?.message ?? errBody?.error ?? errorMessage;
      } catch {
        errorMessage = await response.text().catch(() => errorMessage);
      }
    } else {
      errorMessage = await response.text().catch(() => errorMessage);
    }
    const err: ApiError = { message: errorMessage, status: response.status };
    throw err;
  }

  if (isJson) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}

// ============================================================
// Public (no auth needed) endpoints
// ============================================================
export const authApi = {
  register: (fullName: string, email: string, password: string) =>
      apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password }),
      }, true),

  login: (email: string, password: string) =>
      apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }, true),
};

export const publicSkillsApi = {
  search: (q: string) =>
      apiFetch<Skill[]>(`/api/skills/search?q=${encodeURIComponent(q)}`, {}, true),
};

// ============================================================
// Protected endpoint groups (require Bearer JWT)
// ============================================================
export const usersApi = {
  getById: (userId: string) =>
      apiFetch<User>(`/api/users/${userId}`),

  updateMyBio: (bio: string) =>
      apiFetch<User>("/api/users/my-bio", {
        method: "PATCH",
        body: JSON.stringify(bio),
      }),
};

export const skillsApi = {
  search: (q: string) =>
      apiFetch<Skill[]>(`/api/skills/search?q=${encodeURIComponent(q)}`),

  add: (name: string, category: string) =>
      apiFetch<Skill>("/api/skills/add", {
        method: "POST",
        body: JSON.stringify({ name, category }),
      }),
};

export const userSkillsApi = {
  add: (skillName: string, skillType: "TEACH" | "LEARN", skillCategory?: string) =>
      apiFetch<UserSkill>("/api/user-skills/add", {
        method: "POST",
        body: JSON.stringify({ skillName, skillType, skillCategory }),
      }),

  remove: (skillId: string, skillType: string) =>
      apiFetch<string>(`/api/user-skills/remove?skillId=${skillId}&skillType=${skillType}`, {
        method: "DELETE",
      }),

  getByUser: (userId: string) =>
      apiFetch<UserSkill[]>(`/api/user-skills/${userId}`),

  getTeachingByUser: (userId: string) =>
      apiFetch<UserSkill[]>(`/api/user-skills/${userId}/teach`),

  getLearningByUser: (userId: string) =>
      apiFetch<UserSkill[]>(`/api/user-skills/${userId}/learn`),
    searchProfiles: (name: string):Promise<UserSearchResponse[]> =>
        apiFetch<UserSearchResponse[]>(`/api/user-skills/search-profiles?name=${encodeURIComponent(name)}`),
  getMentorsBySkill: (skillId: string) =>
      apiFetch<UserSkill[]>(`/api/user-skills/mentors/${skillId}`),
};

export const availabilityApi = {
  add: (startTime: string, endTime: string) =>
      apiFetch<Availability>("/api/availability/add", {
        method: "POST",
        body: JSON.stringify({ startTime, endTime }),
      }),

  getMentorSlots: (mentorId: string) =>
      apiFetch<Availability[]>(`/api/availability/mentor/${mentorId}`),
};

 export const myavailabilityApi = {

 getMyAvailabilities: (mentorId: string) =>
 apiFetch<Availability[]>(`/api/availability/mentor/my-slots`),
 };


export const sessionsApi = {
  book: (learnerId: string, skillId: number, availabilityId: number) =>
      apiFetch<Session>("/api/sessions/book", {
        method: "POST",
        body: JSON.stringify({ learnerId, skillId, availabilityId }),
      }),

  updateStatus: (sessionId: string, mentorId: string, status: SessionStatus) =>
      apiFetch<Session>(`/api/sessions/${sessionId}/status?mentorId=${mentorId}&status=${status}`, {
        method: "PATCH",
      }),

  complete: (sessionId: string) =>
      apiFetch<Session>(`/api/sessions/${sessionId}/complete`, { method: "PATCH" }),

  getLearnerSessions: (userId: string) =>
      apiFetch<Session[]>(`/api/sessions/learner/${userId}`),

  getMentorSessions: (userId: string) =>
      apiFetch<Session[]>(`/api/sessions/mentor/${userId}`),

    addMeetingLink: (sessionId: string, meetingLink: string) =>
        apiFetch<Session[]>(`/api/sessions/${sessionId}/meeting-link`, {
            method: "PATCH",
            body: JSON.stringify({ meetingLink }),
        }),
};

export const feedbackApi = {
  leave: (sessionId: string, selectedTags: string[]) =>
      apiFetch<Feedback>("/api/feedback/leave", {
        method: "POST",
        body: JSON.stringify({ sessionId, selectedTags }),
      }),

  getForUser: (userId: string) =>
      apiFetch<Feedback[]>(`/api/feedback/user/${userId}`),

  getTags: () =>
      apiFetch<FeedbackTagDto[]>("/api/feedback/tags"),
};

export const notificationsApi = {
  getInbox: () =>
      apiFetch<Notification[]>("/api/notifications/my-inbox"),

  getUnreadCount: () =>
      apiFetch<number>("/api/notifications/unread-count"),

  markAsRead: (notificationId: string) =>
      apiFetch<string>(`/api/notifications/${notificationId}/read`, { method: "PUT" }),
};

// ============================================================
// TypeScript types matching backend entities/DTOs
// ============================================================
export interface User {
  id: string; //This must be userId
  fullName: string;
  email: string;
  bio?: string;
  credits?: number;
  reputationScore?: number;
  ratingAvg?: number;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}


export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Skill {
  id: number;
  name: string;
  category?: string;
}

export interface UserSkill {
  id: {
    userId: string;
    skillId: number;
    skillType: string;
  };
  user: User;
  skill: Skill;
}

export interface Availability {
  id: number;
  user: User;
  startTime: string; // ISO LocalDateTime
  endTime: string;
  isBooked: boolean;
}

export type SessionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "EXPIRED";

export interface Session {
  id: string;
  learner: User;
  mentor: User;
  skill: Skill;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  createdAt: string;
}

export interface Feedback {
  id: number;
  session: Session;
  giver: User;
  receiver: User;
  feedbackTag: string;
  weight: number;
  createdAt: string;
}

export interface FeedbackTagDto {
  name: string;
  weight: number;
  type: "POSITIVE" | "NEGATIVE";
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserSearchResponse {
    id: string;
    fullName: string;
    email: string;
    ratingAvg?: number;
    reputationScore?: number;
}
