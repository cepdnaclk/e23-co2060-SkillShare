# ZenWare SkillShare WebSocket / STOMP Contract

## Verified Connection Details
- **Native WebSocket Path**: `/ws`
- **Protocol**: STOMP over native WebSocket.
- **SockJS Support**: Unverified / Not explicitly configured in `WebSocketConfig.java` (using `withSockJS()` is absent). **Frontend must use native WebSocket (`ws://` or `wss://`)**.
- **CORS Allowed Origins**: Read from backend `application.properties` (`${cors.allowed.origins}`).

## Connection Authentication
- **Requirement**: `WebSocketAuthInterceptor` intercepts the STOMP `CONNECT` frame.
- **Header Format**: The frontend MUST pass the JWT in the `CONNECT` headers under the key `Authorization` with the value `Bearer <JWT_TOKEN>`.
- **Identity Assignment**: The backend strictly parses the JWT to determine the user identity (`Principal`).
- **Connection Rejection**: If the token is missing, malformed, or expired, the backend throws a `MessageDeliveryException` ("WebSocket authentication failed") and immediately drops the connection attempt.

## STOMP Destinations
- **Application Destination Prefix (Sending)**: `/app`
- **Broker Subscription Prefix (Receiving global)**: `/topic`, `/queue`
- **User Destination Prefix (Receiving private)**: `/user`

## Subscribing to Events (Receiving)
Clients must subscribe to these exact destinations:
1. **Incoming Chat Messages**: `/user/queue/messages`
2. **Incoming Typing Indicators**: `/user/queue/typing`

*Note: STOMP brokers automatically prepend the user-specific routing based on the authenticated Principal when using `/user/queue/...`.*

## Sending Events (Publishing)
Clients must send payloads to these exact destinations:

### 1. Send Chat Message
- **Destination**: `/app/chat`
- **Payload Shape**:
```json
{
  "receiverId": "uuid-string",
  "content": "Message body here"
}
```
*Note: `senderId` and `timestamp` can be omitted by the frontend; the backend forcibly overrides `senderId` from the authenticated Principal and sets the exact server `timestamp` upon DB save.*

### 2. Send Typing Indicator
- **Destination**: `/app/chat/typing`
- **Payload Shape**:
```json
{
  "receiverId": "uuid-string",
  "isTyping": true
}
```
*Note: `senderId` is securely overridden by the backend.*

## Authorization Rules and Unauthorized Behavior
- **Recipient Authorization**: The backend invokes `chatAuthorizationService.isAuthorizedToChat(senderId, receiverId)`. This verifies that the two users are either ACCEPTED connections OR share a session (past, present, or pending). Self-chat is rejected.
- **Unauthorized Sending Behavior**: If a user attempts to send a message or typing indicator to an unauthorized recipient, the backend catches the `UnauthorizedAccessException`, prints a warning to `System.err`, and **drops the message silently**. The sender does NOT receive an error queue message or a STOMP ERROR frame back.

## Message Processing and Persistence
- **Message Persistence**: `ChatMessage` entities are permanently saved to the PostgreSQL database via `ChatMessageRepository` BEFORE they are routed to the receiver.
- **Ordering**: History endpoints (`/api/chat/history/{contactId}`) use standard Spring Data JPA pagination without an explicit `@Query` sort order. Thus, messages are ordered by default DB behavior (usually insertion order). **Frontend should manually sort by timestamp**.
- **Unread Status**: Messages are initially saved with `isRead = false`. When the receiver views the chat, the frontend must call the REST endpoint `PUT /api/chat/mark-read/{contactId}` to bulk update the unread status in the database.
- **Typing Indicators**: Ephemeral. Not saved to the database. Instantly routed to the receiver.

## Known Limitations and Gaps (Verified from Code)
1. **No Backend Error Feedback**: Because unauthorized WebSocket messages are dropped and the exception is caught and printed by the backend, the sending client assumes the message went through successfully.
2. **STOMP Testing**: The backend codebase lacks true E2E WebSocket broker integration tests. Auth interceptor and Chat auth logic are unit-tested independently.
