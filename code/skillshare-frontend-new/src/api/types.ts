// -------------------------------------------------------------
// EXACT TYPESCRIPT DEFINITIONS GENERATED FROM BACKEND CODE
// -------------------------------------------------------------

// --- ENUMS ---
export type SessionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type NotificationType = 'SESSION_UPDATE' | 'SYSTEM_ALERT' | 'MESSAGE';

// --- AUTHENTICATION ---
export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  userId: string; // UUID
  fullName: string;
  email: string;
  role: string;
  xp: number | null; // Integer (Nullable in Java)
  level: number | null; // Integer
  credits: number | null; // Integer
  reputationScore: number | null; // Integer
}

// --- USERS ---
export interface UserPrivateDto {
  id: string; // UUID
  fullName: string;
  email: string;
  bio: string | null;
  profilePictureUrl: string | null;
  credits: number | null;
  xp: number | null;
  level: number | null;
  reputationScore: number | null;
  isProfileCompleted: boolean;
}

export interface UserPublicDto {
  id: string; // UUID
  fullName: string;
  bio: string | null;
  xp: number | null;
  level: number | null;
  reputationScore: number | null;
  profilePictureUrl: string | null;
}

export interface UserSearchResponse {
  id: string; // UUID
  fullName: string;
}

// --- SKILLS & USER SKILLS ---
// Entity returned directly by controller!
export interface Skill {
  id: string; // UUID
  name: string;
  category: string;
}

export interface UserSkillRequest {
  skillName: string;
  skillType: string;
  skillCategory: string;
}

export interface UserSkillDto {
  userId: string; // UUID
  userName: string;
  userBio: string;
  userRatingAvg: number;
  userReputationScore: number;
  skillId: string; // UUID
  skillType: string;
  skillName: string;
  skillCategory: string;
}

export interface TrendingSkillDto {
  skillName: string;
  totalSessions: number;
}

// --- AVAILABILITY ---
export interface AvailabilityRequest {
  startTime: string; // LocalDateTime string e.g. "2026-09-17T15:30:00"
  endTime: string;
}

export interface AvailabilityResponse {
  id: string; // UUID
  mentorId: string; // UUID
  startTime: string; // LocalDateTime string e.g. "2026-09-17T15:30:00"
  endTime: string;
  isBooked: boolean;
  activeSessionId: string | null; // UUID (nullable)
}

// --- SESSIONS ---
export interface SessionRequest {
  skillId: string; // UUID
  availabilityId: string; // UUID
}

export interface SessionResponse {
  id: string; // UUID
  learnerId: string; // UUID
  learnerName: string;
  learnerProfilePictureUrl: string;
  mentorId: string; // UUID
  mentorName: string;
  mentorProfilePictureUrl: string;
  skillId: string; // UUID
  skillName: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  meetingLink: string;
  creditValue: number;
  createdAt: string;
}

// --- FEEDBACK ---
export interface FeedbackRequest {
  sessionId: string; // UUID
  selectedTags: string[];
}

export interface FeedbackResponse {
  id: string; // UUID
  sessionId: string; // UUID
  giverId: string; // UUID
  giverName: string;
  receiverId: string; // UUID
  receiverName: string;
  feedbackTag: string | null;
  weight: number | null;
  createdAt: string;
}

export interface FeedbackTagDto {
  name: string;
  weight: number;
  type: string;
}

// --- DASHBOARD ---
export interface DashboardResponse {
  fullName: string;
  credits: number;
  bookedSessions: number;
  pendingRequests: number;
  skillsAdded: number;
  feedbackReceived: number;
  reputationScore: number;
  averageRating: number;
}

// --- CONNECTIONS ---
export interface ConnectionDto {
  id: string; // UUID
  sender: UserPublicDto;
  receiver: UserPublicDto;
  status: ConnectionStatus; // Status string, matches ConnectionStatus enum
}

export interface ConnectionStatusDto {
  status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';
  connectionId: string | null; // UUID (Nullable)
}

// --- NOTIFICATIONS ---
// Entity returned directly by controller!
export interface Notification {
  id: string; // UUID
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  // recipient is @JsonIgnore'd in Java, so it will not serialize to JSON
}

// --- CHAT & WEBSOCKET ---
export interface ChatMessageDto {
  senderId: string; // UUID
  receiverId: string; // UUID
  content: string;
  timestamp: string; // LocalDateTime
}

export interface TypingStatusDto {
  senderId: string; // UUID
  receiverId: string; // UUID
  isTyping: boolean; // Mapped via @JsonProperty("isTyping")
}

export interface RecentChatDto {
  contactId: string; // UUID
  contactName: string;
  contactProfilePicture: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessageResponse {
  id: string; // UUID
  senderId: string; // UUID
  receiverId: string; // UUID
  content: string;
  isRead: boolean;
  timestamp: string; // LocalDateTime
}

// --- COMMON WRAPPERS ---
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

export interface Page<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}
