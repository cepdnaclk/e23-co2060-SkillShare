# Frontend Integration Foundation

This document describes the frontend integration architecture established in Mission 19F-14.

---

## Frontend Architecture

- **Framework**: React 18 + Vite + TypeScript
- **Routing**: React Router v6
- **State Management**: React Context (`AuthContext`, `ChatContext`) + TanStack React Query
- **UI**: Tailwind CSS + Shadcn UI (Radix UI primitives)
- **HTTP Client**: Native `fetch` wrapped in `src/api/client.ts`
- **WebSocket**: `@stomp/stompjs` in `src/services/chatSocketService.ts`
- **Form Handling**: React Hook Form + Zod

---

## API Module Structure

All API code lives in `src/api/`:

```
src/api/
  client.ts          — Core fetch wrapper, error normalization, base URL
  types.ts           — All TypeScript types verified from backend contract
  routes.ts          — Backend API route constants + typed helpers
  auth.api.ts        — Login, register
  users.api.ts       — getMe, getById, updateMyBio, uploadProfilePicture
  skills.api.ts      — search, add
  userSkills.api.ts  — add, remove, getByUser, searchProfiles, getMentorsBySkill
  availability.api.ts — add, getMyAvailabilities, getMentorSlots, delete
  sessions.api.ts    — book, updateStatus, complete, cancel, meetings
  feedback.api.ts    — leave, getForUser, getTags
  dashboard.api.ts   — trending mentors, learners, skills
  connections.api.ts — getStatus, sendRequest, accept, reject, friends
  notifications.api.ts — getInbox, getUnreadCount, markAsRead
  chat.api.ts        — getRecentChats, getHistory, markAsRead, getUnreadCount
```

### Compatibility Layer

`src/lib/api.ts` and `src/lib/chatApi.ts` are now **compatibility re-export layers** that re-export everything from `src/api/*`. All existing UI consumers continue to work unchanged.

> **TODO**: Migrate UI pages to import directly from `src/api/*` and remove the compatibility layers once migration is complete.

---

## API Client Usage

### Basic Usage

```ts
import { apiFetch } from "@/api/client";

const data = await apiFetch<MyType>("/users/me");
```

### With Options

```ts
const result = await apiFetch<ResponseType>("/sessions/book", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

### Skip Auth (Public Endpoints)

```ts
const result = await apiFetch<ResponseType>("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
}, true); // skipAuth = true
```

### FormData (Profile Picture Upload)

```ts
const formData = new FormData();
formData.append("file", file);
// Do NOT set Content-Type manually — browser sets boundary automatically
const result = await apiFetch<{ imageUrl: string }>("/users/profile-picture", {
  method: "POST",
  body: formData,
});
```

---

## URL Construction

The REST API controllers include `/api` in their own `@RequestMapping`. There is no `server.servlet.context-path` set. This means:

| Layer | Example |
|-------|---------|
| Server root | `http://localhost:8080` |
| REST controller mapping | `@RequestMapping("/api/users")` → `http://localhost:8080/api/users` |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` |
| Route constant (from `routes.ts`) | `/users/me` (no `/api` prefix) |
| Final URL constructed by client | `http://localhost:8080/api` + `/users/me` = `http://localhost:8080/api/users/me` ✅ |

The client includes a path-stripping safeguard: if a path accidentally starts with `/api/`, the client strips it to prevent double-prefix. This does **not** affect the normal operation of `routes.ts` constants, which do not carry the `/api/` prefix.

---

## Environment Configuration

Copy `.env.example` to `.env` and update as needed:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

The client reads `VITE_API_BASE_URL` first, then falls back to `VITE_API_URL`, then to `http://localhost:8080/api`.

> **Never commit `.env` files.** They are already `.gitignore`d.

---

## Authentication Behavior

- **Token storage**: JWT stored in `localStorage` under key `skillshare_token` via `src/lib/auth.ts`.
- **Token injection**: `apiFetch` reads the token via `getToken()` from `src/lib/auth.ts` and injects `Authorization: Bearer <token>` for all requests unless `skipAuth = true`.
- **Login flow**: `AuthContext.tsx` calls `authApi.login()`, stores the token, then calls `usersApi.getMe()` to hydrate the user object.
- **Logout**: `AuthContext.tsx` calls `removeToken()` and `removeStoredUser()`, clearing `localStorage`.
- **401 handling**: The client normalizes 401 errors to `"Session expired or unauthorized. Please log in."`. It does **not** automatically redirect or clear auth — this prevents redirect loops on public endpoint failures or login failures.

> **Known Risk**: JWT is stored in `localStorage`, which is vulnerable to XSS. Migrating to `httpOnly` cookies is a deferred security improvement.

---

## Error Normalization

All API errors are thrown as `ApiError` objects:

```ts
interface ApiError {
  message: string;
  status?: number;
  validationErrors?: Record<string, string>;
}
```

HTTP status normalization:

| Status | Message |
|--------|---------|
| 401 | `"Session expired or unauthorized. Please log in."` |
| 403 | `"You do not have permission to perform this action."` |
| 500 | `"An internal server error occurred."` |
| Network error | `"Network error. Please check your connection or try again later."` |

---

## React Query Integration

API functions in `src/api/*` return plain `Promise<T>` values and are fully compatible with TanStack React Query:

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ["sessions", "learner", userId],
  queryFn: () => sessionsApi.getLearnerSessions(userId),
});
```

---

## WebSocket Setup

The STOMP WebSocket client lives in `src/services/chatSocketService.ts`.

### Verified Endpoint (from `WebSocketConfig.java`)

The backend registers the WebSocket endpoint at `/ws` directly at the server root — it is **not** under the `/api` prefix:

```java
// WebSocketConfig.java
registry.addEndpoint("/ws")
```

The correct connection URLs are:
- Local: `ws://localhost:8080/ws`
- Production (HTTPS): `wss://<host>/ws`

The `chatSocketService.ts` derives this correctly by stripping `/api` from `VITE_API_BASE_URL` before constructing the WebSocket URL:

```ts
// VITE_API_BASE_URL = "http://localhost:8080/api"
// → strip /api → "http://localhost:8080"
// → replace http → ws → "ws://localhost:8080"
// → append /ws → "ws://localhost:8080/ws" ✅
const WS_URL = `${_apiBase.replace(/\/api\/?$/, "").replace(/^http/, "ws")}/ws`;
```

### Subscriptions and Topics

| Direction | Destination |
|-----------|------------|
| Send message | `/app/chat` |
| Send typing | `/app/chat/typing` |
| Receive message | `/user/queue/messages` |
| Receive typing | `/user/queue/typing` |

### Duplicate Subscription Analysis

No duplicate STOMP client instances are created. Here is the lifecycle:

1. `chatSocketService.connect()` guards with `if (this.client?.active) return` — calling `connect()` multiple times when already connected is a no-op.
2. Subscriptions to `/user/queue/messages` and `/user/queue/typing` are issued inside `onConnect`. This callback fires on the initial connect and again after each auto-reconnect. Subscriptions are recreated inside `onConnect`, which is expected for reconnecting STOMP sessions. Current lifecycle cleanup prevents duplicate handlers during normal React effect cleanup.
3. Handler registration (via `chatSocketService.onMessage(handler)`) occurs in the `ChatContext` `useEffect`, which correctly cleans up via its return function (`unsubMsg()`, `unsubTyping()`, `disconnect()`). This removes handler references when the context unmounts or when `token`/`user.id` changes.

> **Known risk**: Reconnect behavior (whether the underlying STOMP library properly invalidates old subscriptions on reconnect) should be verified in an actual broker connection test before relying on it in production. React Strict Mode double-invocation of the `useEffect` cycle creates a brief window where duplicate handlers could be registered — this is a general React Strict Mode concern.

### Other WebSocket Risks

- **Silent authorization drops**: If the backend rejects the STOMP CONNECT frame (expired JWT), the connection will fail. The `onStompError` handler logs the error, but there is no client-side event to trigger automatic logout or token refresh.
- **No explicit SockJS**: The backend does not expose a SockJS fallback endpoint. Only native WebSocket is supported.
- **Message logging**: Raw message bodies are logged at `console.warn` level (lines 33-35 in `chatSocketService.ts`). Consider removing this before production deployment to avoid logging message content.

---

## TypeScript Types

All types are in `src/api/types.ts` (copied from the verified backend contract in `docs/frontend-types.ts`).

Key types:
- `UserPrivateDto` — authenticated user's own data
- `UserPublicDto` — public profile data
- `AvailabilityResponse` — includes `isBooked` (Java `@JsonProperty("isBooked")` verified), `activeSessionId: string | null`
- `SessionResponse` — flat DTO, no lazy entity proxies
- `ChatMessageResponse` — new DTO (not raw entity)
- `Page<T>` — Spring pagination: `{ content: T[], totalElements, totalPages, number, size }`

---

## Timestamp Handling

The backend returns `LocalDateTime` **without timezone information**. All timestamps should be treated as local server time. This is a known risk that may cause UI display issues for users in different timezones.

> **Deferred**: Adding `ZonedDateTime` or UTC offset to the backend is a future improvement.

---

## Remaining Risks

| Risk | Severity | Status |
|------|----------|--------|
| `LocalDateTime` without timezone | Medium | Known, deferred |
| Silent WebSocket drop on auth expiry (no logout trigger) | Medium | Known, documented |
| Raw message body logged at `console.warn` in chatSocketService | Low | Known, should be removed before production |
| `Skill` and `Notification` returned as raw entities (not DTOs) | Low | Known, documented |
| JWT in `localStorage` (XSS exposure) | Medium | Known, deferred security work |
| `src/lib/api.ts` compatibility layer still exists | Low | TODO — migrate UI consumers and remove |

---

## Deferred Work

- Migrate all UI pages to import from `src/api/*` directly and remove `src/lib/api.ts` compatibility layer
- Add React Query hooks layer if the project grows to need shared cache management
- Migrate token storage from `localStorage` to `httpOnly` cookies (security improvement)
- Remove debug `console.warn` message body logging from `chatSocketService.ts` before production
- Add UTC offset to backend `LocalDateTime` responses
