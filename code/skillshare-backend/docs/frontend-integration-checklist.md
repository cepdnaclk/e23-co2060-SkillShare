# ZenWare SkillShare Frontend Integration Checklist

This guide provides practical integration requirements for the React frontend, based strictly on the verified backend codebase capabilities.

## 1. Authentication

- [ ] **Login Flow**: Submit `AuthenticationRequest` to `/api/auth/login`. Store the returned `token`, `userId`, `role`, and other stats securely (e.g., `localStorage`).
- [ ] **Registration Flow**: Submit `RegisterRequest` to `/api/auth/register`. On success, the backend returns the same `AuthenticationResponse` as login, meaning you can immediately log the user in without a separate login request.
- [ ] **Authorization Header**: All protected REST endpoints require the HTTP header: `Authorization: Bearer <TOKEN>`.
- [ ] **Handling 401 Responses**: If any REST request returns a 401 Unauthorized, the frontend must immediately wipe the token from storage and redirect the user to the Login page.
- [ ] **Handling 403 Responses**: If a 403 is encountered, display a "You do not have permission to perform this action" toast/alert.
- [ ] **Handling Expired JWTs**: The backend will throw standard 401s when a token expires. There is NO refresh token endpoint in this backend. The user must re-authenticate.
- [ ] **Logout Behavior**: There is NO `/api/auth/logout` endpoint. Logout is strictly a frontend operation: delete the JWT and local user state, then redirect to the login page.

## 2. REST Integration

- [ ] **Base URL**: Prepend `/api` to all routes (e.g., `https://backend.domain.com/api`).
- [ ] **JSON Headers**: Add `Content-Type: application/json` to your API client defaults.
- [ ] **Multipart Upload Handling**: For `/api/users/profile-picture`, remove the `Content-Type: application/json` header so the browser can automatically set the `multipart/form-data` boundary. Attach the file using `FormData`.
- [ ] **Error Parsing**: Extract the user-friendly message from the backend's standard error response: `err.response.data.message`.
- [ ] **Pagination Handling**: For endpoints like `/api/chat/history`, append `?page=0&size=50`. Consume the returned `content` array for the data, and use `totalPages` / `last` booleans to conditionally render "Load More" buttons.
- [ ] **Timestamp Parsing**: Incoming `LocalDateTime` strings (e.g. `"2026-09-17T15:30:00"`) lack timezone suffixes. Parse them cautiously, ideally treating them as local time depending on backend server configuration, or format them gently.
- [ ] **Enum Handling**: Send and expect all enums (e.g., `SessionStatus.ACCEPTED`) as exact uppercase Strings.
- [ ] **Loading & Empty States**: Rely on standard React state (`isLoading`, `isError`, `data.length === 0`).
- [ ] **Retry Considerations**: Be cautious with automatic retries on `POST` or `PATCH` endpoints (like Session booking or Credit transfers) as there are no explicit idempotency keys (UUID idempotency) provided by the frontend.

## 3. WebSocket / STOMP Integration

- [ ] **Connection Setup**: Use `@stomp/stompjs`. Connect strictly to `ws://` or `wss://` at the `/ws` path. Do NOT use SockJS fallbacks.
- [ ] **STOMP Connection Headers**: 
  ```javascript
  const stompClient = new Client({
    brokerURL: 'ws://domain.com/ws',
    connectHeaders: { Authorization: `Bearer ${token}` }
  });
  ```
- [ ] **Subscription Setup**: Once connected, immediately subscribe to `/user/queue/messages` (for chat) and `/user/queue/typing` (for typing indicators).
- [ ] **Reconnection Behavior**: Enable `stompClient.reconnectDelay = 5000;`. If the JWT expires during a reconnect, the backend will reject the STOMP CONNECT frame. 
- [ ] **Cleanup on Logout**: Ensure you call `stompClient.deactivate()` during the frontend logout routine to close the TCP socket securely.
- [ ] **Typing Event Handling**: When receiving a typing payload, display a UI indicator for ~3 seconds, then automatically clear it, as the backend does not send a separate "stopped typing" event.
- [ ] **Unauthorized Recipient Behavior**: If the frontend sends a chat message to an unauthorized user, the backend will silently drop it. Ensure your UI logic verifies connections locally before allowing the user to press "Send".
- [ ] **Message Persistence**: The backend saves chat messages before routing them. Upon opening a chat window, immediately fetch `/api/chat/history/{id}` to get the historical context.

## 4. Known Backend Limitations (Verified)

- **Missing OpenAPI Specification**: There is no Swagger UI or OpenAPI JSON available from the backend. 
- **Missing STOMP Integration Tests**: The WebSocket pipeline relies heavily on unit tests. Real-world broker edge cases (like silent message dropping) require manual frontend E2E testing.
- **Ambiguous Timezone Behavior**: The backend serializes timestamps without explicit `Z` (UTC) offsets. 
- **Entity Responses**: `/api/skills/search`, `/api/notifications/my-inbox`, and `/api/availability/my-slots` serialize raw JPA Entities instead of DTOs.
- **Missing Pagination Limits**: Some list endpoints (like `/api/connections/friends`) do not enforce pagination, meaning large networks could cause payload bloat.
- **Missing Chat Moderation**: There are no API endpoints to delete messages, block users, or report users.
- **Missing Credit Debt Resolution**: Users can enter a negative credit state (`CreditDebt`), but no API exists to manually resolve or pay off this debt.
