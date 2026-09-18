# ZenWare SkillShare REST API Contract

## 1. Base API URL
All paths below are relative to `/api` unless otherwise specified. 

## 2. Global Headers
- `Content-Type: application/json` for all requests, except file uploads (`multipart/form-data`).
- `Authorization: Bearer <JWT_TOKEN>` is required for all endpoints EXCEPT those explicitly marked as "Auth: Public".

## 3. Global Error Response
All endpoints handle errors via `GlobalExceptionHandler` returning the following exact JSON shape:
```json
{
  "timestamp": "2026-09-17T15:30:00.123",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed"
}
```

---

## 4. Authentication Endpoints

### 4.1. Register
- **Method**: `POST`
- **Path**: `/auth/register`
- **Auth**: Public
- **Request Body**: `RegisterRequest` DTO
- **Success Status**: 200 OK
- **Success Body**: `AuthenticationResponse` DTO
- **Error Statuses**: 400 (Validation), 500
- **Returns**: DTO

### 4.2. Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth**: Public
- **Request Body**: `AuthenticationRequest` DTO
- **Success Status**: 200 OK
- **Success Body**: `AuthenticationResponse` DTO
- **Error Statuses**: 400 (Validation), 401 (Invalid Credentials), 500
- **Returns**: DTO

---

## 5. User & Profile Endpoints

### 5.1. Get My Profile
- **Method**: `GET`
- **Path**: `/users/me`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: `UserPrivateDto` DTO
- **Error Statuses**: 401, 500
- **Returns**: DTO

### 5.2. Get User Profile by ID
- **Method**: `GET`
- **Path**: `/users/{id}`
- **Auth**: Required
- **Path Param**: `id` (UUID)
- **Success Status**: 200 OK
- **Success Body**: `UserPublicDto` DTO
- **Error Statuses**: 401, 404, 500
- **Returns**: DTO

### 5.3. Update Bio
- **Method**: `PATCH`
- **Path**: `/users/my-bio`
- **Auth**: Required
- **Request Body**: Raw JSON string (e.g., `"New Bio"`)
- **Success Status**: 200 OK
- **Success Body**: `UserPublicDto` DTO
- **Returns**: DTO

### 5.4. Upload Profile Picture
- **Method**: `POST`
- **Path**: `/users/profile-picture`
- **Auth**: Required
- **Headers**: `Content-Type: multipart/form-data`
- **Form Field**: `file` (MultipartFile)
- **Success Status**: 200 OK
- **Success Body**: Map `{"status": "success", "message": "...", "imageUrl": "..."}`
- **Error Statuses**: 400, 401, 500
- **Returns**: Map

---

## 6. Skill Endpoints

### 6.1. Add a Skill
- **Method**: `POST`
- **Path**: `/skills/add`
- **Auth**: Public
- **Request Body**: `Skill` JSON
- **Success Status**: 200 OK
- **Success Body**: `Skill` Entity
- **Error Statuses**: 409 (Conflict), 500
- **Returns**: Entity directly (Verified from source)

### 6.2. Search Skills
- **Method**: `GET`
- **Path**: `/skills/search`
- **Auth**: Public
- **Query Param**: `q` (String)
- **Success Status**: 200 OK
- **Success Body**: List of `Skill` Entities
- **Returns**: List<Entity> directly

---

## 7. User Skill Endpoints

### 7.1. Add User Skill
- **Method**: `POST`
- **Path**: `/user-skills/add`
- **Auth**: Required
- **Request Body**: `UserSkillRequest` DTO
- **Success Status**: 200 OK
- **Success Body**: `UserSkillDto`
- **Returns**: DTO

### 7.2. Remove User Skill
- **Method**: `DELETE`
- **Path**: `/user-skills/remove`
- **Auth**: Required
- **Query Params**: `skillId` (UUID), `skillType` (String)
- **Success Status**: 200 OK
- **Success Body**: Raw String `"Skill removed from profile successfully."`
- **Returns**: String

### 7.3. Get All User Skills
- **Method**: `GET`
- **Path**: `/user-skills/{userId}`
- **Auth**: Public
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `UserSkillDto`
- **Returns**: List<DTO>

### 7.4. Find Mentors By Skill
- **Method**: `GET`
- **Path**: `/user-skills/mentors/{skillId}`
- **Auth**: Public
- **Path Param**: `skillId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `UserSkillDto`
- **Returns**: List<DTO>

### 7.5. Get User Teaching Skills
- **Method**: `GET`
- **Path**: `/user-skills/{userId}/teach`
- **Auth**: Public
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `UserSkillDto`
- **Returns**: List<DTO>

### 7.6. Get User Learning Skills
- **Method**: `GET`
- **Path**: `/user-skills/{userId}/learn`
- **Auth**: Public
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `UserSkillDto`
- **Returns**: List<DTO>

### 7.7. Search Profiles Auto-suggest
- **Method**: `GET`
- **Path**: `/user-skills/search-profiles`
- **Auth**: Public
- **Query Param**: `name` (String)
- **Success Status**: 200 OK
- **Success Body**: List of `UserSearchResponse`
- **Returns**: List<DTO>

---

## 8. Availability Endpoints

### 8.1. Add Availability
- **Method**: `POST`
- **Path**: `/availability/add`
- **Auth**: Required
- **Request Body**: `AvailabilityRequest` DTO
- **Success Status**: 200 OK
- **Success Body**: `AvailabilityResponse` DTO
- **Error Statuses**: 400, 401, 409
- **Returns**: Entity directly

### 8.2. Delete Availability
- **Method**: `DELETE`
- **Path**: `/availability/{availabilityId}`
- **Auth**: Required
- **Path Param**: `availabilityId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: Raw String
- **Returns**: String

### 8.3. Get Mentor Slots
- **Method**: `GET`
- **Path**: `/availability/mentor/{mentorId}`
- **Auth**: Required
- **Path Param**: `mentorId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `AvailabilityResponse` DTOs
- **Returns**: List<Entity> directly

### 8.4. Get My Slots
- **Method**: `GET`
- **Path**: `/availability/my-slots`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: List of `AvailabilityResponse` DTOs
- **Returns**: List<Entity> directly

---

## 9. Session Endpoints

### 9.1. Book Session
- **Method**: `POST`
- **Path**: `/sessions/book`
- **Auth**: Required
- **Request Body**: `SessionRequest` DTO
- **Success Status**: 200 OK
- **Success Body**: `SessionResponse` DTO
- **Error Statuses**: 400, 401, 409
- **Returns**: DTO

### 9.2. Update Status
- **Method**: `PATCH`
- **Path**: `/sessions/{sessionId}/status`
- **Auth**: Required
- **Path Param**: `sessionId` (UUID)
- **Query Param**: `status` (Enum: `SessionStatus`)
- **Success Status**: 200 OK
- **Success Body**: `SessionResponse` DTO
- **Returns**: DTO

### 9.3. Complete Session
- **Method**: `PATCH`
- **Path**: `/sessions/{sessionId}/complete`
- **Auth**: Required
- **Path Param**: `sessionId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: `SessionResponse` DTO
- **Returns**: DTO

### 9.4. Cancel Session
- **Method**: `PUT`
- **Path**: `/sessions/{sessionId}/cancel`
- **Auth**: Required
- **Path Param**: `sessionId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: `SessionResponse` DTO
- **Returns**: DTO

### 9.5. Get My Classes (Learner)
- **Method**: `GET`
- **Path**: `/sessions/learner/{userId}`
- **Auth**: Required
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `SessionResponse` DTO
- **Returns**: List<DTO>

### 9.6. Get My Schedule (Mentor)
- **Method**: `GET`
- **Path**: `/sessions/mentor/{userId}`
- **Auth**: Required
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `SessionResponse` DTO
- **Returns**: List<DTO>

### 9.7. Add Meeting Link
- **Method**: `PATCH`
- **Path**: `/sessions/{sessionId}/meeting-link`
- **Auth**: Required
- **Path Param**: `sessionId` (UUID)
- **Request Body**: Map `{"meetingLink": "..."}`
- **Success Status**: 200 OK
- **Success Body**: `SessionResponse` DTO
- **Returns**: DTO

---

## 10. Feedback Endpoints

### 10.1. Leave Feedback
- **Method**: `POST`
- **Path**: `/feedback/leave`
- **Auth**: Required
- **Request Body**: `FeedbackRequest` DTO
- **Success Status**: 200 OK
- **Success Body**: `FeedbackResponse` DTO
- **Returns**: DTO

### 10.2. Get User Feedback
- **Method**: `GET`
- **Path**: `/feedback/user/{userId}`
- **Auth**: Public
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: List of `FeedbackResponse` DTO
- **Returns**: List<DTO>

### 10.3. Get Tags
- **Method**: `GET`
- **Path**: `/feedback/tags`
- **Auth**: Public
- **Success Status**: 200 OK
- **Success Body**: List of `FeedbackTagDto`
- **Returns**: List<DTO>

---

## 11. Dashboard Endpoints

### 11.1. Get My Dashboard
- **Method**: `GET`
- **Path**: `/dashboard/me`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: `DashboardResponse` DTO
- **Returns**: DTO

---

## 12. Connections Endpoints

### 12.1. Request Connection
- **Method**: `POST`
- **Path**: `/connections/request/{receiverId}`
- **Auth**: Required
- **Path Param**: `receiverId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: Map `{"status": "success", "message": "..."}`
- **Returns**: Map

### 12.2. Accept Connection
- **Method**: `PUT`
- **Path**: `/connections/accept/{connectionId}`
- **Auth**: Required
- **Path Param**: `connectionId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: Map
- **Returns**: Map

### 12.3. Reject Connection
- **Method**: `DELETE`
- **Path**: `/connections/reject/{connectionId}`
- **Auth**: Required
- **Path Param**: `connectionId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: Map
- **Returns**: Map

### 12.4. Get Pending
- **Method**: `GET`
- **Path**: `/connections/pending`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: List of `ConnectionDto`
- **Returns**: List<DTO>

### 12.5. Get Connection Status
- **Method**: `GET`
- **Path**: `/connections/status/{userId}`
- **Auth**: Required
- **Path Param**: `userId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: `ConnectionStatusDto`
- **Returns**: DTO

### 12.6. Get Friends
- **Method**: `GET`
- **Path**: `/connections/friends`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: List of `ConnectionDto`
- **Returns**: List<DTO>

---

## 13. Notifications Endpoints

### 13.1. Get My Inbox
- **Method**: `GET`
- **Path**: `/notifications/my-inbox`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: List of `Notification` Entities
- **Returns**: List<Entity> directly (Note: Recipient field is @JsonIgnore)

### 13.2. Get Unread Count
- **Method**: `GET`
- **Path**: `/notifications/unread-count`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: Long (primitive number)
- **Returns**: Number

### 13.3. Mark Read
- **Method**: `PUT`
- **Path**: `/notifications/{notificationId}/read`
- **Auth**: Required
- **Path Param**: `notificationId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: Raw String
- **Returns**: String

---

## 14. Chat REST Endpoints

### 14.1. Get Chat History
- **Method**: `GET`
- **Path**: `/chat/history/{contactId}`
- **Auth**: Required
- **Path Param**: `contactId` (UUID)
- **Query Params**: `page` (int, default 0), `size` (int, default 50)
- **Success Status**: 200 OK
- **Success Body**: `Page<ChatMessage>` (Entity inside Page wrapper)
- **Returns**: PageWrapper<Entity>

### 14.2. Get Global Unread Count
- **Method**: `GET`
- **Path**: `/chat/unread-count`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: Map `{"unreadCount": 0}`
- **Returns**: Map

### 14.3. Mark Contact Read
- **Method**: `PUT`
- **Path**: `/chat/mark-read/{contactId}`
- **Auth**: Required
- **Path Param**: `contactId` (UUID)
- **Success Status**: 200 OK
- **Success Body**: Map `{"status": "success", "message": "..."}`
- **Returns**: Map

### 14.4. Get Recent Chats
- **Method**: `GET`
- **Path**: `/chat/recent`
- **Auth**: Required
- **Success Status**: 200 OK
- **Success Body**: List of `RecentChatDto`
- **Returns**: List<DTO>
