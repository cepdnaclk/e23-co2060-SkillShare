// -------------------------------------------------------------
// EXACT API ROUTE CONSTANTS VERIFIED FROM CONTROLLERS
// -------------------------------------------------------------

export const API_ROUTES = {
  // --- AUTHENTICATION ---
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',

  // --- USERS ---
  USERS_ME: '/users/me',
  USERS_UPDATE_BIO: '/users/my-bio',
  USERS_UPLOAD_PROFILE_PICTURE: '/users/profile-picture',
  userById: (id: string) => `/users/${id}`,

  // --- SKILLS ---
  SKILLS_ADD: '/skills/add',
  SKILLS_SEARCH: '/skills/search', // Requires query param: ?q={query}

  // --- USER SKILLS ---
  USER_SKILLS_ADD: '/user-skills/add',
  USER_SKILLS_REMOVE: '/user-skills/remove', // Requires query params: ?skillId={id}&skillType={type}
  USER_SKILLS_SEARCH_PROFILES: '/user-skills/search-profiles', // Requires query param: ?name={name}
  userSkillsByUserId: (userId: string) => `/user-skills/${userId}`,
  mentorsBySkillId: (skillId: string) => `/user-skills/mentors/${skillId}`,
  teachingSkillsByUserId: (userId: string) => `/user-skills/${userId}/teach`,
  learningSkillsByUserId: (userId: string) => `/user-skills/${userId}/learn`,

  // --- AVAILABILITY ---
  AVAILABILITY_ADD: '/availability/add',
  AVAILABILITY_MY_SLOTS: '/availability/my-slots',
  deleteAvailability: (availabilityId: string) => `/availability/${availabilityId}`,
  mentorSlotsByMentorId: (mentorId: string) => `/availability/mentor/${mentorId}`,

  // --- SESSIONS ---
  SESSIONS_BOOK: '/sessions/book',
  SESSIONS_EXPIRE_OVERDUE: '/sessions/expire-overdue',
  updateSessionStatus: (sessionId: string) => `/sessions/${sessionId}/status`, // Requires query param: ?status={SessionStatus}
  completeSession: (sessionId: string) => `/sessions/${sessionId}/complete`,
  cancelSession: (sessionId: string) => `/sessions/${sessionId}/cancel`,
  addMeetingLink: (sessionId: string) => `/sessions/${sessionId}/meeting-link`,
  learnerSessionsByUserId: (userId: string) => `/sessions/learner/${userId}`,
  mentorSessionsByUserId: (userId: string) => `/sessions/mentor/${userId}`,

  // --- FEEDBACK ---
  FEEDBACK_LEAVE: '/feedback/leave',
  FEEDBACK_TAGS: '/feedback/tags',
  feedbackByUserId: (userId: string) => `/feedback/user/${userId}`,

  // --- DASHBOARD ---
  DASHBOARD_ME: '/dashboard/me',

  // --- TRENDING ---
  TRENDING_MENTORS: '/trending/mentors',
  TRENDING_LEARNERS: '/trending/learners',
  TRENDING_SKILLS: '/trending/skills',
  trendingMentorsByCategory: (category: string) => `/trending/mentors/category/${category}`,

  // --- CONNECTIONS ---
  CONNECTIONS_PENDING: '/connections/pending',
  CONNECTIONS_FRIENDS: '/connections/friends',
  requestConnection: (receiverId: string) => `/connections/request/${receiverId}`,
  acceptConnection: (connectionId: string) => `/connections/accept/${connectionId}`,
  rejectConnection: (connectionId: string) => `/connections/reject/${connectionId}`,
  connectionStatusByUserId: (userId: string) => `/connections/status/${userId}`,

  // --- NOTIFICATIONS ---
  NOTIFICATIONS_MY_INBOX: '/notifications/my-inbox',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
  markNotificationRead: (notificationId: string) => `/notifications/${notificationId}/read`,

  // --- CHAT REST ---
  CHAT_UNREAD_COUNT: '/chat/unread-count',
  CHAT_RECENT: '/chat/recent',
  chatHistoryByContactId: (contactId: string) => `/chat/history/${contactId}`, // Takes ?page={page}&size={size}
  markChatRead: (contactId: string) => `/chat/mark-read/${contactId}`,

  // --- ADMIN ---
  ADMIN_OVERVIEW: '/admin/overview',
  ADMIN_USERS: '/admin/users',
  adminUserById: (userId: string) => `/admin/users/${userId}`,
  ADMIN_SKILLS: '/admin/skills',
  adminSkillById: (skillId: string) => `/admin/skills/${skillId}`,
  ADMIN_SESSIONS: '/admin/sessions',

  //---REPORTS---
  REPORTS: "/reports",
  ADMIN_REPORTS: "/admin/reports",
  adminReportResolve: (reportId: string | number) => `/admin/reports/${reportId}/resolve`,
};
