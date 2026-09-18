# Mission 19F-12: API Contract Verification & Frontend Integration Blueprint

## 1. Files Inspected
- All `*Controller.java` classes (11 controllers).
- All DTO classes (18 request/response DTOs).
- Direct serialized Entities (`Skill`, `Availability`, `Notification`).
- Enums (`SessionStatus`, `ConnectionStatus`, `NotificationType`).
- `WebSocketConfig.java`, `WebSocketAuthInterceptor.java`, `ChatAuthorizationService.java`.
- `SecurityConfig.java`, `GlobalExceptionHandler.java`.
- Configuration property files (`application.properties`, `application-dev.properties`, etc).

## 2. Files Created
- `docs/frontend-api-contract.md` (Precise REST endpoint behavior)
- `docs/frontend-types.ts` (Exact TypeScript interfaces mirroring backend shapes)
- `docs/api-routes.ts` (Exported route constants/functions for the React client)
- `docs/websocket-contract.md` (STOMP and Messaging broker rules)
- `docs/frontend-integration-checklist.md` (Actionable guide for React engineers)
- `docs/frontend-contract-risks.md` (Identified structural flaws impacting the frontend)

## 3. Verified Endpoint Count
- **Total REST Endpoints Verified**: 38

## 4. Verified DTO / Type Count
- **Total DTOs / Types Extracted**: 20 DTOs, 3 Enums, 3 Raw Entities.

## 5. WebSocket Findings
- **Connection**: `ws://` / `wss://` at `/ws` using native STOMP without SockJS.
- **Auth**: Requires JWT attached to the `CONNECT` STOMP frame header (`Authorization: Bearer <token>`).
- **Authorization**: Message and typing deliveries are intercepted, verified against `chatAuthorizationService`, and silently dropped if unauthorized.
- **Persistence**: Messages are saved to Postgres prior to delivery.

## 6. Unresolved Questions
- **Timezone Contract**: Time is transmitted as floating `LocalDateTime` strings without offsets (e.g., `"2026-09-17T15:30:00"`). Frontend and Backend teams must determine whether this indicates UTC or server-local time.

## 7. Backend Changes Required BEFORE Frontend Integration
- **Fix Direct Entity Serialization**: Create `AvailabilityDto` to replace direct return of the `Availability` entity in `AvailabilityController`. The current entity returns an eager/lazy relationship (`User`) without `@JsonIgnore`, risking fatal infinite loops or lazy-initialization crashes during Jackson serialization.

## 8. Backend Changes That Can Safely Wait (Post-Frontend Integration)
- Implementing pagination limits (maximum `?size=`) on unbounded `GET` endpoints.
- Restricting `POST /api/skills/add` from public access to authenticated users to prevent spam.
- Adding a Debt Resolution endpoint.
- Refactoring `Skill` and `Notification` to DTOs (currently safe due to exact `@JsonIgnore` usage, but fragile).
- E2E WebSocket Integration tests.

## 9. Recommended Next Mission
- **Mission 19F-13: Contract Hardening & Bug Fixes**. Address the high-priority risk (Availability Entity mapping), enforce timezone configuration, and restrict the public skill addition endpoint before officially cutting the frontend-backend integration branch.

---

### Verification Summary
- **Compile Result**: SUCCESS
- **Test Result**: SUCCESS (193/193 tests passed, 0 failures, 0 skipped).
- **Git Status**: Clean. No tracked files modified. Only `docs/` is untracked.
- **Git Diff Check**: Empty.
- **Git Diff Stat**: Empty.
