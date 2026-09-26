# Chat timestamp and leaderboard picture fixes

Branch: `fix/chat-timezone-leaderboard-dp`.
Starting point: fetched `origin/main`, commit `692725a02d89c134dcb8151684db0efb8d034ef6`.

## Chat: cause and complete data flow

Previously, `ChatContext.sendMessage` displayed an optimistic timestamp from
`new Date().toISOString()`, which includes `Z` and therefore identifies an instant.
The STOMP request sent sender, receiver and content to `/app/chat`. `ChatController`
authenticated the sender, checked chat authorization and saved `ChatMessage`.
Hibernate's `@CreationTimestamp` generated a JVM-local `LocalDateTime`, stored in
PostgreSQL's timestamp-without-time-zone column. No offset accompanied that value.

The controller copied this naive timestamp into `ChatMessageDto` for the receiver's
`/user/queue/messages` subscription. Separately, `ChatService` copied it into
`ChatMessageResponse` for `/api/chat/history/{contactId}` and `RecentChatDto` for
`/api/chat/recent`. `ChatContext` retained those strings unchanged. `ActiveChatPanel`
uses `date-fns` to format `new Date(timestamp)` in the browser timezone; the inbox
also parses the timestamp as a JavaScript Date.

For the reported UTC backend, 08:07 in Colombo was persisted/returned as 02:37
without an offset. The browser interpreted this as 02:37 *local time*, whereas the
optimistic `02:37Z` correctly displayed 08:07. Matching local server/browser
timezones concealed this discrepancy during development. The sender previously
received no saved-message acknowledgement, so kept its browser-generated time
until history was reloaded.

The fix:

- Chat entity and all three outgoing chat timestamp DTO fields use `Instant`.
- A `@PrePersist` callback assigns server `Instant.now()` at database microsecond
  precision. A client timestamp never determines the stored time.
- `ChatTimestampConverter`, explicitly applied only to this field, maps between
  `Instant` and UTC `LocalDateTime` in the existing column. `SqlTypes.LOCAL_DATE_TIME`
  selects JDBC's direct Java-time binding, avoiding JVM timezone conversions through
  `java.sql.Timestamp`. No global timezone setting or other entity is changed.
- REST history, inbox and WebSocket JSON now carry ISO-8601 timestamps ending in
  `Z`. Existing browser-local formatting is correct and requires no fixed offset.
- Requests may include a `clientMessageId`. After saving, the server supplies its
  database `id` and timestamp to the receiver and acknowledges the sender when
  this correlation field is present. `ChatContext` replaces the corresponding
  optimistic message, preserving read state and avoiding duplicate acknowledgements.
  Identical message content does not confuse correlation. Legacy requests without
  this field retain receiver-only delivery.

Thus `2026-09-26T02:37:00Z` remains the same instant in both users' state, history,
and after remount; each browser displays it in that user's own timezone.

## Database and existing messages

There is no column-type change, migration, rewrite or deletion. The existing
`timestamp(6) without time zone` column continues to store UTC wall-clock fields.
The instant contract is enforced by the chat-specific converter and JDBC binding.
Database session timezone is not used to interpret this column.

Existing rows are interpreted as UTC, matching the reported production behavior.
Production database contents and historical Railway timezone settings were not
inspected. A legacy row written by a non-UTC server (including older local data)
does not contain enough information to recover its original timezone. If such data
must be preserved with exact historical instants, first establish its source zone
and affected range, then perform a separately reviewed normalization. Do not apply
a blanket offset correction to production rows.

## Leaderboard: cause and fix

The mentor, learner/XP and category queries return full `User` entities; the
existing `UserPublicDto` and TypeScript type already declare `profilePictureUrl`.
`FileUploadService` stores both the Cloudinary-generated display URL and public ID.
Profiles and connections map the display URL correctly, and search already renders it.

`TrendingService.mapToPublicDto` omitted that URL for all three leaderboard paths.
Additionally, `Leaderboard.tsx` unconditionally rendered initials. Both were fixed:
the shared trending mapper copies `user.getProfilePictureUrl()`, and the XP page
uses the existing `Avatar`, `AvatarImage` and `AvatarFallback` components to render
that URL with the original initials and styling as fallback. Failed image loads
also retain initials. No Cloudinary URL is reconstructed and no ranking query,
XP, reputation or cache schedule is changed. The existing cache refresh interval
remains ten minutes; server startup also refreshes it.

## Changed files

Backend production files, under `src/main/java/com/zenware/skillsharebackend/`:

- `controller/ChatController.java`
- `dto/ChatMessageDto.java`
- `dto/ChatMessageResponse.java`
- `dto/RecentChatDto.java`
- `entity/ChatMessage.java`
- `persistence/ChatTimestampConverter.java` (new)
- `service/TrendingService.java`

Backend regression files, under `src/test/java/com/zenware/skillsharebackend/`:

- `controller/ChatControllerTest.java`
- `controller/ChatRestControllerTest.java`
- `controller/PostgresChatTimestampIT.java` (new; reuses chat regression tests)
- `service/TrendingServiceTest.java` (new)

Frontend files, under `code/skillshare-frontend-new/src/`:

- `api/types.ts`
- `context/ChatContext.tsx`
- `context/ChatContext.test.tsx` (new)
- `pages/Leaderboard.tsx`
- `pages/Leaderboard.test.tsx` (new)

This report is the only additional documentation file. Unnecessary chat debug
prints were removed from the changed controller/context. No deployment configuration,
credentials, environment files or dependency versions were changed.

## Verification

Final results: **219 unit/H2 tests and 14 PostgreSQL integration tests passed**
(zero failures, errors or skips). Backend verification and executable JAR packaging
succeeded. **All 13 frontend tests passed**, TypeScript validation succeeded, and
the Vite production build succeeded.

- Backend `mvn -B verify`: runs the full unit/H2 suite, packages the Spring Boot JAR,
  and runs the PostgreSQL integration tests. A disposable PostgreSQL 17 cluster was
  used on loopback port 55439, with a `Pacific/Auckland` database session timezone.
  Production Neon was not contacted. The installed Maven 3.9.12 binary was used
  because the Windows wrapper failed before starting Maven.
- The persistence regression changes JVM timezone between UTC, Colombo, New York
  and Honolulu and checks raw column values, fresh repository reads, REST history
  and inbox timestamps. A legacy SQL timestamp fixture verifies UTC interpretation.
- The actual configured STOMP message converter is checked for the same ISO `Z`
  output as REST. Controller tests verify sender/receiver acknowledgements and
  retain existing authorization tests.
- Trending tests cover mentor, learner/XP and category mapper results, actual URL
  versus public ID, missing pictures, unchanged order and unchanged scores.
- Frontend `npx tsc --noEmit -p tsconfig.app.json`, `npm test` and `npm run build`.
  Tests cover optimistic send, server acknowledgement, duplicate acknowledgement,
  conversation reload, provider remount, incoming WebSocket data, Colombo/UTC
  display, actual leaderboard picture URL and missing/broken-picture fallback.

Automated tests exercise the application components, persistence and serialization;
they are not a live two-browser test against Vercel/Railway/Neon. Deploy the backend
before or together with the frontend so offset-bearing timestamps are available.
The frontend build reports existing bundle-size and outdated Browserslist-data
warnings; these do not prevent the production build.
