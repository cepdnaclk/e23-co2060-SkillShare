# SkillShare — CO2060 Milestone 4 Final Presentation
## Master Presentation Blueprint & Technical Storyline (Version 2 Refinement)

---

## 1. Presentation Strategy

### Core Philosophy
This presentation blueprint follows the **Microinspect engineering presentation philosophy**:
- **Clarity over buzzwords:** Demonstrates genuine, functioning software engineering rather than memorized textbook definitions or marketing claims.
- **Evidence-first narrative:** Every technical claim is categorized (`VERIFIED`, `NEEDS VERIFICATION`, `DEFERRED`) and tied directly to repository code, configuration, or test results.
- **Microinspect slide design:** 
  - `ON SLIDE`: High-density visual elements (clean architectural blocks, sequence flows, comparison cards, and concise metrics). No paragraphs, no tiny source-code dumps.
  - `SPEAKER EXPLAINS`: Clear, conversational explanations spoken by student engineers demonstrating how and why systems were built.
- **Live demonstration as core proof:** The live demo is not a secondary exhibit; it is the central proof of a working peer-to-peer system (session lifecycle, atomic credit deduction, and real-time STOMP messaging).

### Constraints & Target Metrics
- **Total Presentation Duration:** **9 minutes and 50 seconds** (includes a calibrated 10-second safety buffer below the strict 10:00 limit).
- **Presentation Breakdown:** ~6:35 slide presentation + ~3:15 live demonstration.
- **Viva Duration:** 5:00 minutes technical evaluation immediately following the presentation.
- **Slide Count:** Exactly 8 slides.
- **Team Participation (All 4 Members Speak):**
  - **Irusha Bandara (E/23/035):** System Architecture, Concurrency Controls & Security.
  - **Poorna Gamage (E/23/104):** Frontend SPA Architecture, STOMP Messaging Client & Live Demo.
  - **Hiruni Weerasinghe (E/23/430):** Quality Assurance, Automated Tests & Collaboration Evidence.
  - **Sashika Rathnayake (E/23/317):** Economic State Machine, Feedback Iterations & Final Deliverables.

---

## 2. Verified Codebase Summary

The following points represent verified facts extracted directly from the released `main` branch:

- **Repository:** `cepdnaclk/e23-co2060-SkillShare` on branch `main` (`HEAD` at commit `8904a79`).
- **Git History:** Exactly **342 commits** on the `main` branch across 4 contributors:
  - Irusha Bandara: 180 commits
  - Poorna Gamage: 78 commits (`poornamg`: 77, `Poorna Gamage`: 1)
  - Hiruni Weerasinghe: 49 commits (`hiruni`: 31, `Hiruni942`: 18)
  - Sashika Rathnayake: 35 commits (`Sashika48`: 30, `Sashika Rathnayake`: 5)
  - Active feature branches visible in repository history: `chatsystem`, `creditscore`, `demoBot`, `feedbackerror`, `friendreq`, `jwtAdvanced`, `qa-testing`, `sessionCancellation`, `tokenexpire`.
- **Backend Stack:** Java 21, Spring Boot 3.x, Maven, Spring Data JPA, Hibernate, Spring Security 6 (Stateless JWT + BCrypt), Spring Messaging (WebSocket over STOMP with SockJS fallback), Cloudinary SDK.
- **Frontend Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, Context API (`AuthContext`, `ChatContext`, `ThemeContext`), `@stomp/stompjs`, `sockjs-client`. Strict TypeScript checking compiles with **0 errors**.
- **Database:** PostgreSQL with 10 relational entities: `User`, `Skill`, `UserSkill`, `Availability`, `Session`, `ChatMessage`, `Connection`, `Feedback`, `Report`, `CreditDebt`.
  - Composite primary key on `UserSkillId` (`userId`, `skillId`, `skillType`).
  - Unique constraint on `Connection` (`sender_id`, `receiver_id`).
- **Backend Test Suite:** **207 automated tests** (0 failures, 0 errors, 0 skipped) in JUnit 5 and Mockito across unit, WebMvc mock, and integration layers.
- **API Test Suite:** 18 automated HTTP requests with 30 assertions in Postman/Newman with a 100% pass rate.
- **Frontend Test Suite:** 3 unit tests in Vitest (`src/lib/api.test.ts`, `src/test/example.test.ts`) validating API error handling and token injection.
- **Scope Boundary:** 1-on-1 peer sessions and scheduling are implemented. Group Sessions and Course Pools are **deferred** to future work.

---

## 3. Evidence Status

To avoid making unsupported claims, all assertions in the presentation are categorized below:

| Technical Claim | Status | Source / Verification Evidence | Presentation Handling |
|---|---|---|---|
| Stateless JWT Authentication & BCrypt | **VERIFIED** | `SecurityConfig.java`, `JwtAuthenticationFilter.java` | Highlighted in Slide 2 & Slide 3 |
| Zero-Trust WebSocket Authentication | **VERIFIED** | `WebSocketAuthInterceptor.java` (`CONNECT` frame inspection) | Highlighted in Slide 3 |
| Chat Permission Authorization | **VERIFIED** | `ChatAuthorizationService.java` (Friend status or shared session) | Highlighted in Slide 3 & Live Demo |
| Atomic Credit & Availability Transactions | **VERIFIED** | `UserRepository.java`, `AvailabilityRepository.java` native queries | Highlighted in Slide 3 & Slide 4 |
| Background Session Expiration & Refund | **VERIFIED** | `SessionExpirationProcessor.java`, `SessionExpirationScheduler.java` | Highlighted in Slide 4 |
| Account Freeze / Suspension | **VERIFIED** | `User.isActive`, `AuthenticationService.java`, `AdminService.java` | Highlighted in Slide 8 & Viva |
| 207 Automated Backend Tests Passing | **VERIFIED** | Maven test suite run, 0 failures, 0 errors | Highlighted in Slide 6 |
| 18 Newman API Requests / 30 Assertions | **VERIFIED** | `qa/postman/SkillShare-API.postman_collection.json` | Highlighted in Slide 6 |
| 0 TypeScript Compilation Errors | **VERIFIED** | `tsc --noEmit` clean exit across frontend codebase | Highlighted in Slide 6 |
| 342 Commits across 4 Team Members | **VERIFIED** | `git rev-list --count HEAD`, `git shortlog -sn HEAD` | Highlighted in Slide 6 |
| Raw Survey / Interview Artifacts in Repo | **NEEDS VERIFICATION** | Not committed in repo files (must be brought to viva) | Mark as action item; do not claim files are in repo |
| Sub-50ms WebSocket Latency | **REMOVED** | No formal latency benchmark measured in repo | Replaced with "immediate user-visible delivery" |
| 100% Code Coverage Claim | **REMOVED** | JaCoCo/coverage report not formally generated | Replaced with exact test counts (207 tests) |
| Group Sessions Implemented | **DEFERRED** | Documented in `functional-requirements.md` as future scope | Explicitly marked as Deferred in Slide 8 |

---

## 4. Final 8-Slide Structure

---

### Slide 1 — Problem Space & The SkillShare Paradigm

- **Slide Number:** 1 of 8
- **Slide Title:** Solving Campus Skill Silos: The SkillShare Platform
- **Purpose:** Introduce the university peer-learning problem, target users, and SkillShare's core approach.
- **Approximate Time:** 0:45 (45 seconds)
- **Presenter:** Irusha Bandara

```text
============================== ON SLIDE ==============================
[Header]: SkillShare — Peer-to-Peer Campus Knowledge Exchange
[Subheader]: Team ZenWare | University of Peradeniya (CO2060 Milestone 4)

[Visual Left]: The Campus Problem
  • Fragmented WhatsApp groups with unorganized tutoring requests
  • Manual, unreliable scheduling with frequent student no-shows
  • High cost of commercial tutoring platforms
  • Unstructured peer knowledge with zero accountability or verification

[Visual Right]: The SkillShare Solution
  • Direct Peer-to-Peer Discovery: Connect students across departments
  • Fluid Roles: Every student can teach strengths and learn weaknesses
  • Internal Credit Economy: 10 credits held in escrow per 1-on-1 session
  • Verifiable Reputation: Mutual ratings and XP progression

[Footer]: Target Users: University Students | Platform: Responsive Web Application
======================================================================
```

- **SPEAKER EXPLAINS:**
  "Good morning members of the evaluation panel. In any university faculty, students possess valuable academic and technical skills, but there is no structured way to share them. Juniors often struggle with difficult coursework, while seniors who excelled in those subjects have no convenient way to mentor them. Outside of informal WhatsApp chats or expensive commercial tutoring, students lack a reliable platform with verified scheduling and mutual accountability.
  
  Team ZenWare built **SkillShare**: a full-stack, peer-to-peer skill exchange platform designed specifically for university students. On SkillShare, students are not locked into rigid student or tutor accounts. Instead, any student can offer mentoring in skills they know, earn platform credits, and spend those credits to learn from peers. Sessions are scheduled based on verified availability and protected by an internal credit escrow system."

- **Visual:** Clean 2-column comparison card: "The Campus Problem" vs. "The SkillShare Solution" with simple icons.
- **Technical Depth:** Introduces the fluid user model (one user entity participating as both learner and mentor) and the credit escrow incentive structure.
- **Evidence:** `docs/README.md` (Introduction), `docs/functional-requirements.md` (FR-01, FR-03).
- **Demo Connection:** Prepares evaluators for the single-user experience shown in the live demonstration.
- **Transition:** "To make this peer exchange fast and reliable, we structured the platform as a decoupled web application."

---

### Slide 2 — System Architecture & Data Flow

- **Slide Number:** 2 of 8
- **Slide Title:** System Architecture: Decoupled Full-Stack Architecture
- **Purpose:** Illustrate how the frontend, backend, database, and real-time services interact.
- **Approximate Time:** 1:00 (60 seconds)
- **Presenter:** Poorna Gamage

```text
============================== ON SLIDE ==============================
[Architecture Diagram: Clean Layered Flow]

[Client Tier: React 18 + TypeScript + Vite]
  ├── Page Views (14 Routes via React Router v6)
  ├── State Contexts (AuthContext, ChatContext)
  └── Typed Fetch API Clients
         │                                    │
    (HTTP / REST)                      (WebSocket / STOMP)
    Bearer JWT in Headers              Bearer JWT in CONNECT Frame
         │                                    │
         ▼                                    ▼
[Backend Tier: Spring Boot 3 on Java 21]
  ├── Stateless Gateway: JwtAuthenticationFilter
  ├── Real-Time Broker: WebSocketAuthInterceptor + In-Memory STOMP
  ├── Application Services: @Transactional Service Boundaries
  └── Background Daemons: SessionExpirationScheduler
         │
         ▼
[Persistence Tier: PostgreSQL Relational Database]
  ├── 10 Relational Tables with Foreign Key Constraints
  └── Atomic Queries: Row-level conditional SQL updates
======================================================================
```

- **SPEAKER EXPLAINS:**
  "Our architecture is built on a clean separation of concerns. On the frontend, we use React 18 with TypeScript, built with Vite. The client application contains 14 dedicated pages and uses React Context providers to manage authentication and real-time chat state without unnecessary global state libraries.
  
  Communication with our Java 21 Spring Boot backend uses two distinct channels:
  1. Standard transactional operations—such as user authentication, profile updates, and session booking—use stateless REST endpoints secured by our `JwtAuthenticationFilter`.
  2. Peer-to-peer messaging and session notifications use full-duplex WebSockets over the STOMP protocol, avoiding the need for HTTP polling.
  
  At the persistence layer, PostgreSQL manages 10 relational tables. Instead of relying solely on application-level locks, we execute atomic conditional queries directly in SQL to maintain data integrity under concurrent user actions."

- **Visual:** High-contrast 3-box architecture diagram showing the client tier, backend services, and PostgreSQL database, with distinct arrows for REST (HTTP) and WebSocket (STOMP) communication.
- **Technical Depth:** Decoupled client architecture, dual-channel communication, and database-level constraint handling.
- **Evidence:** `README.md` (Architecture), `SecurityConfig.java`, `WebSocketConfig.java`, `docs/database-er-model.md`.
- **Demo Connection:** Explains the underlying connections that will be exercised during the live demo.
- **Transition:** "Let us look at two specific engineering challenges where this architecture protected data and connection integrity."

---

### Slide 3 — Critical Engineering Implementation

- **Slide Number:** 3 of 8
- **Slide Title:** Core Technical Implementation: Concurrency & Channel Security
- **Purpose:** Demonstrate genuine engineering depth by explaining atomic balance updates and WebSocket channel security.
- **Approximate Time:** 1:15 (75 seconds)
- **Presenter:** Irusha Bandara

```text
============================== ON SLIDE ==============================
[Component 1]: Atomic Conditional Credit Deduction
  • Problem: Concurrent booking clicks could read the same balance, allowing account overdrafts.
  • Solution: Database-level conditional update in UserRepository:
      UPDATE users SET credits = credits - :amount 
      WHERE id = :id AND credits >= :amount;
  • Result: Database row lock ensures deduction succeeds only if funds are sufficient.

[Component 2]: Zero-Trust STOMP Handshake Interceptor
  • Problem: STOMP messages bypass standard HTTP servlet filters after the initial handshake.
  • Solution: WebSocketAuthInterceptor inspects the STOMP CONNECT frame directly:
      - Extracts Bearer token from native STOMP headers
      - Validates JWT signature and loads UserDetails
      - Binds authenticated Principal to the WebSocket session
  • Result: Server derives sender identity from authenticated Principal, preventing ID spoofing.

[Component 3]: Chat Permission Authorization
  • Problem: Preventing users from subscribing or sending messages to arbitrary peers.
  • Solution: ChatAuthorizationService validates sender and receiver:
      - Allowed only if users share an accepted Connection OR a historical/active Session.
======================================================================
```

- **SPEAKER EXPLAINS:**
  "I want to highlight two critical areas of implementation:
  
  First, in our credit economy, booking a session costs 10 credits held in escrow. If we simply read the user's balance into Java, checked it, and wrote it back, simultaneous requests from duplicate clicks could create a race condition and cause a negative balance. To solve this, we wrote an atomic conditional query in `UserRepository`: `UPDATE users SET credits = credits - :amount WHERE id = :userId AND credits >= :amount`. The database evaluates this atomically. If the balance is under 10 credits, zero rows are updated, and the service rolls back the transaction with an `IllegalStateException`.
  
  Second, securing real-time chat required custom handling. Standard Spring Security filters only inspect the initial HTTP connection, not subsequent STOMP messages. We built `WebSocketAuthInterceptor`, which intercepts the STOMP `CONNECT` frame, extracts the Bearer JWT from native headers, validates the token, and attaches the authenticated principal to the session.
  
  Furthermore, before any message is saved or routed, `ChatAuthorizationService` checks whether the sender and receiver have an accepted connection or a shared learning session. This prevents unauthorized students from messaging each other."

- **Visual:** Two structured cards with simplified code/SQL callouts: one for the atomic SQL update and one for the STOMP interceptor sequence.
- **Technical Depth:** Database concurrency control, ACID properties, WebSocket channel interception, access control matrix.
- **Evidence:** `UserRepository.java:L52-61`, `WebSocketAuthInterceptor.java:L26-60`, `ChatAuthorizationService.java:L22-39`.
- **Demo Connection:** These exact mechanisms execute when the learner books a session and sends a chat message during the demo.
- **Transition:** "Arriving at these stable implementations required us to rethink our original algorithmic approach."

---

### Slide 4 — Challenges & Evolution of the System

- **Slide Number:** 4 of 8
- **Slide Title:** Engineering Challenges & System Evolution
- **Purpose:** Demonstrate how empirical testing and architectural bottlenecks led to key design improvements.
- **Approximate Time:** 1:00 (60 seconds)
- **Presenter:** Sashika Rathnayake

```text
============================== ON SLIDE ==============================
[Challenge 1]: The "Skill-Cycle" Matchmaking Bottleneck
  • Original Design: Circular multi-user matching graph (A teaches B, B teaches C, C teaches A).
  • Discovered Flaw: High algorithmic wait times, circular schedule deadlocks, and fragile chains.
  • Evolution: Replaced circular matching with a decentralized 10-Credit Economy and self-managed slots.
  • Result: Immediate liquidity; students can learn without waiting for a reciprocal partner.

[Challenge 2]: Resolving LazyInitialization in REST Responses
  • Problem: Hibernate throwing LazyInitializationException during JSON serialization of Session entities.
  • Solution: Enforced strict DTO mapping inside @Transactional service methods before response return.
  • Result: Entities never leak uninitialized proxies to Jackson serialization.

[Challenge 3]: Stale Bookings Locking Student Credits
  • Problem: Unanswered pending session requests left learner credits locked in escrow.
  • Solution: Built SessionExpirationProcessor running on a Spring @Scheduled interval to auto-expire
    stale requests and execute automatic credit refunds.
======================================================================
```

- **SPEAKER EXPLAINS:**
  "Our software evolved significantly through development.
  
  Our biggest architectural shift was moving away from our initial 'Skill-Cycle' matchmaking concept. Originally, we planned an algorithm to find circular study groups where Student A teaches Student B, B teaches C, and C teaches A. In practice, finding closed cycles with compatible university timetables caused unacceptable wait times, and if one student canceled, the whole chain broke. We pivoted to a credit-based economy: students earn 10 credits when they teach and spend 10 credits when they learn. This eliminated the circular dependency completely.
  
  On the backend, we resolved Hibernate `LazyInitializationExceptions` by enforcing that entities are mapped to DTOs *inside* the transaction boundary before being returned to controllers.
  
  Finally, to prevent pending session requests from indefinitely locking a student's credits in escrow if a mentor does not respond, we added `SessionExpirationProcessor`. A background scheduler checks for expired availability slots, transitions the session to `EXPIRED`, and refunds the 10 credits back to the learner."

- **Visual:** Before-and-after comparison diagram showing the fragile circular matching graph transitioning to the direct credit-based exchange model.
- **Technical Depth:** Graph matching trade-offs vs. micro-economy design, JPA entity lifecycle management, and background scheduling.
- **Evidence:** `docs/README.md:L60-66`, `SessionService.java:L129-133`, `SessionExpirationProcessor.java:L33-72`.
- **Demo Connection:** Explains the credit balance and slot availability behavior that evaluators will see in the live demonstration.
- **Transition:** "Now that we have explained how these systems are structured, let us see the actual platform running live."

---

### Slide 5 — LIVE FINAL PRODUCT DEMONSTRATION

- **Slide Number:** 5 of 8
- **Slide Title:** Live Demonstration: End-to-End Peer Learning Journey
- **Purpose:** Guide the live demonstration of the working system across a realistic 1-on-1 learning workflow.
- **Approximate Time:** 3:15 (195 seconds)
- **Presenter:** Poorna Gamage & Irusha Bandara (Dual-Browser Execution)

```text
============================== ON SLIDE ==============================
[Live Demonstration: Complete Peer Interaction Journey]

Phase 1: Discovery & Availability Inspection (0:00 - 0:45)
  • Log in as Learner | Balance: 100 Credits, Level 1
  • Search mentors by skill ("Java" / "Spring Boot") and select an open availability slot

Phase 2: Atomic Booking & Escrow Reservation (0:45 - 1:20)
  • Book selected slot | Balance decrements immediately: 100 → 90 Credits
  • Availability slot is reserved; session state enters PENDING

Phase 3: Real-Time Notification & Acceptance (1:20 - 1:55)
  • Mentor window receives instant STOMP notification alert
  • Mentor accepts session | Session status transitions: PENDING → ACCEPTED

Phase 4: Authorized Real-Time Chat (1:55 - 2:40)
  • Open Floating Chat Widget between Learner and Mentor
  • Send bi-directional messages and show live typing indicator via STOMP

Phase 5: Early Completion & Payout (2:40 - 3:15)
  • Learner marks session as COMPLETED early
  • Mentor receives +10 credits from escrow | Both users receive +20 XP progression
======================================================================
```

- **SPEAKER EXPLAINS (Spoken During Live Execution):**
  *(0:00–0:45)* "We are running the live application with our frontend on Vite port 5173 and our backend on port 8080 connected to PostgreSQL. On the left screen, we log in as our learner, Irusha. On our dashboard, you see our starting balance of 100 credits. We go to Search, find our peer mentor, and view their available time slots.
  
  *(0:45–1:20)* We select a slot and click 'Book Session'. Notice the credit counter at the top right: it immediately drops from 100 to 90 credits. Our backend atomic SQL query executed row-level locking, deducting the credits and reserving the availability slot in a single transaction.
  
  *(1:20–1:55)* On the right screen, logged in as the mentor, the notification bell illuminates immediately via our STOMP notification topic. The mentor opens their Sessions view and clicks 'Accept'. The session state updates to `ACCEPTED`.
  
  *(1:55–2:40)* Because these two users now share an accepted session, our `ChatAuthorizationService` authorizes them to communicate. We open the chat widget, send a message from the learner, and observe immediate delivery on the mentor's screen without refreshing.
  
  *(2:40–3:15)* Because the tutoring session has concluded, our platform allows the learner to complete the session early. The learner clicks 'Complete'. The 10 credits in escrow are released to the mentor, and both students receive 20 XP, dynamically updating their level progress."

- **Visual:** Dual browser windows shown side-by-side (Learner on Chrome left, Mentor on Incognito right). Slide 5 serves as the reference guide on screen before and after window switching.
- **Technical Depth:** End-to-end integration: JWT authentication, atomic SQL updates, STOMP event dispatch, and role-authorized completion.
- **Evidence:** Working system running locally backed by PostgreSQL.
- **Demo Connection:** This is the live execution.
- **Transition:** "Having demonstrated the system live, let us review the automated testing and team collaboration behind this implementation."

---

### Slide 6 — Testing & Team Collaboration Evidence

- **Slide Number:** 6 of 8
- **Slide Title:** Automated Testing & Team Collaboration Evidence
- **Purpose:** Present verified testing counts alongside concrete evidence of team division and version control.
- **Approximate Time:** 1:00 (60 seconds)
- **Presenter:** Hiruni Weerasinghe

```text
============================== ON SLIDE ==============================
[Testing Verification Metrics]
  • Backend Test Suite (JUnit 5 + Mockito): 
      207 Tests Executed | 0 Failures | 0 Errors | 0 Skipped
  • API Regression Suite (Newman / Postman): 
      18 API Requests | 30 Automated Assertions | 100% Pass Rate
  • Frontend Verification (Vitest + TypeScript): 
      3 Unit Tests Passed | 0 TypeScript Errors across entire client codebase
  • Security Boundary Tests:
      MockMvc tests verify 401 Unauthorized on protected routes and 403 on /api/admin

[Team Collaboration & Version Control]
  • 342 Commits on main branch across all 4 team members:
      - Irusha Bandara: 180 commits (Architecture, Security, Database, Concurrency)
      - Poorna Gamage: 78 commits (Frontend UI, STOMP Chat Client, Schedule Views)
      - Hiruni Weerasinghe: 49 commits (Backend Unit Tests, Newman API Regressions)
      - Sashika Rathnayake: 35 commits (Gamification Logic, Feedback Engine, Documentation)
  • Branch-Based Collaboration: Feature branches (chatsystem, creditscore, qa-testing)
======================================================================
```

- **SPEAKER EXPLAINS:**
  "To ensure system reliability, we implemented automated tests across multiple tiers.
  
  Our backend test suite contains **207 automated tests** written with JUnit 5 and Mockito, running with zero failures, zero errors, and zero skipped tests. This suite includes unit tests for core services, MockMvc tests for controllers, and tests for our background schedulers. We paid particular attention to boundary conditions: for example, `testBookSession_InsufficientCredits` verifies that an attempt to book with fewer than 10 credits throws an exception and leaves the user balance unchanged.
  
  For API testing, we maintain an automated Postman regression suite executed via Newman in our `qa/postman/` directory. It runs 18 requests and evaluates 30 automated assertions across authentication, session creation, and admin endpoints. On the frontend, strict TypeScript compilation yields zero errors, backed by unit tests in Vitest.
  
  Our collaboration is reflected in our Git history: **342 commits** on our `main` branch across all four team members. We organized our work through dedicated feature branches—such as `chatsystem`, `creditscore`, and `qa-testing`—allowing us to work in parallel on the frontend, backend, and testing suites."

- **Visual:** Split slide: Left side displays test summary metric badges ("207 Backend Tests", "18 Newman Requests", "0 TS Errors"); Right side displays a Git commit breakdown and branch distribution card.
- **Technical Depth:** Multi-tiered testing, MockMvc security assertions, and version control governance.
- **Evidence:** `code/skillshare-backend/src/test/`, `qa/postman/SkillShare-API.postman_collection.json`, `git shortlog -sn HEAD`.
- **Demo Connection:** Confirms that the flows demonstrated live are backed by regression-tested guarantees.
- **Transition:** "In addition to technical testing, user feedback directly shaped several of our core features."

---

### Slide 7 — Customer Feedback $\rightarrow$ Implementation

- **Slide Number:** 7 of 8
- **Slide Title:** Customer & Peer Feedback $\rightarrow$ Implementation Changes
- **Purpose:** Demonstrate how user feedback and evaluation directly produced concrete engineering changes.
- **Approximate Time:** 0:50 (50 seconds)
- **Presenter:** Sashika Rathnayake

```text
============================== ON SLIDE ==============================
[Feedback Item 1]: Flexible Availability Slots
  • Identified Issue: Recurring weekly schedules caused booking clashes when academic timetables shifted.
  • Implementation: Redesigned AvailabilityController to support discrete, custom date-time blocks.
  • Result: Mentors post open slots in seconds; booking conflicts due to timetable shifts were eliminated.

[Feedback Item 2]: Reciprocal Dual Feedback
  • Identified Issue: Mentors feared one-sided retaliatory ratings if learners found topics difficult.
  • Implementation: Built FeedbackService with a two-way review model requiring ratings from both parties.
  • Result: Balanced reputation scoring; session reviews require mutual participation.

[Feedback Item 3]: Unanswered Request Timeout
  • Identified Issue: Learners expressed concern that forgotten requests would hold credits indefinitely.
  • Implementation: Engineered SessionExpirationProcessor to automatically expire stale requests.
  • Result: Unanswered requests time out automatically and return credits to the learner.

[Verification Notice]: Original survey forms and interview sheets will be presented in the viva.
======================================================================
```

- **SPEAKER EXPLAINS:**
  "Feedback from peer testing sessions led directly to three significant improvements in our application:
  
  First, students found recurring weekly calendar availability impractical because university lab schedules and deadlines change every couple of weeks. In response, we modified `AvailabilityController` and our frontend time picker to allow mentors to post discrete, flexible time blocks. This made availability management simple and eliminated booking clashes.
  
  Second, senior students worried that one-sided reviews might lead to unfair ratings if a learner struggled with a challenging topic. We implemented a dual-feedback model in `FeedbackService`: after a session, both the mentor and the learner provide feedback with structured tags, creating a fair, balanced reputation score.
  
  Third, early testers pointed out that if a mentor missed a notification, the learner's 10 credits remained locked in escrow. We resolved this by building `SessionExpirationProcessor`, which automatically cancels stale pending requests and refunds the credits to the learner.
  
  *(Note: Original Google Form survey summaries and feedback sheets are compiled in our team documentation for the viva session.)*"

- **Visual:** 3 clean evolution cards showing "Identified Friction" $\rightarrow$ "Implementation Change" $\rightarrow$ "Result".
- **Technical Depth:** User-centered iteration, bidirectional rating design, and automated timeout handling.
- **Evidence:** `AvailabilityController.java`, `FeedbackService.java`, `SessionExpirationProcessor.java`.
- **Demo Connection:** Explains why the availability picker and feedback screens work as shown in the live demonstration.
- **Transition:** "These iterations bring SkillShare to its final delivered state for Milestone 4."

---

### Slide 8 — Final State & Professional Deliverables

- **Slide Number:** 8 of 8
- **Slide Title:** Final Milestone 4 Delivery & Deliverables Status
- **Purpose:** Present the verified status of planned features, confirm professional deliverables, and provide a strong technical conclusion.
- **Approximate Time:** 0:45 (45 seconds)
- **Presenter:** Irusha Bandara / Full Team

```text
============================== ON SLIDE ==============================
[Milestone 4 Implementation Status]
  ✔ JWT Authentication & GitHub OAuth2 ────────────── VERIFIED (Complete)
  ✔ Peer Discovery & Category Search ───────────────── VERIFIED (Complete)
  ✔ 1-on-1 Availability & Session Lifecycle ────────── VERIFIED (Complete)
  ✔ 10-Credit Atomic Escrow Economy ────────────────── VERIFIED (Complete)
  ✔ STOMP over WebSocket Real-Time Chat ────────────── VERIFIED (Complete)
  ✔ Gamification Engine (XP, Levels, Leaderboard) ──── VERIFIED (Complete)
  ✔ Admin Moderation & Account Freeze ──────────────── VERIFIED (Complete)
  ○ Group Sessions & Course Pool Integration ───────── DEFERRED (Future Scope)

[Professional Deliverables Checklist]
  • User Manual & Developer Guide: Fully documented in docs/
  • Automated Test Suites: 207 JUnit tests + Postman API collection in qa/postman/
  • Project Page: Live on GitHub Pages (https://cepdnaclk.github.io/e23-co2060-SkillShare/)
  • Code Repository: Clean main branch with full documentation
======================================================================
```

- **SPEAKER EXPLAINS:**
  "In conclusion, Team ZenWare has delivered on all core functional commitments for Milestone 4. Our working platform includes JWT and OAuth2 authentication, peer discovery, 1-on-1 session scheduling, our atomic credit escrow system, full-duplex STOMP chat, XP gamification, and administrator moderation.
  
  As defined in our release scope, 1-on-1 peer sessions are completely implemented and verified, while group study sessions have been intentionally deferred to our future roadmap to ensure transaction stability.
  
  All required professional deliverables are complete: our User Manual and Developer Guide are maintained in our `docs/` directory, our Postman API suites are documented in `qa/postman/`, and our project site is deployed on GitHub Pages. With 342 commits across all four team members and 207 automated tests backing our implementation, SkillShare is a fully functional, verified peer-learning platform.
  
  Thank you for your time, and we look forward to your questions in the viva."

- **Visual:** Clean checklist with green checkmarks for completed items and a distinct circle for deferred items, alongside icons for User Manual, Developer Guide, Postman suite, and GitHub Pages.
- **Technical Depth:** Scope boundary enforcement, deliverable completeness, and project governance.
- **Evidence:** `docs/functional-requirements.md`, `README.md`, `qa/postman/`, `docs/data/index.json`.
- **Demo Connection:** Summarizes the complete working system demonstrated in Slide 5.
- **Transition:** "Ready for the 5-minute technical viva."

---

## 5. Live Demonstration Plan

### Primary Demo (Target: 3:15)
The primary live demo follows a scripted, single-journey path between two student accounts:

1. **Setup:**
   - Chrome window (left): Logged in as Learner (`learner@skillshare.com`).
   - Chrome Incognito window (right): Logged in as Mentor (`mentor@skillshare.com`).
   - Backend running on `localhost:8080`, Frontend on `localhost:5173`, PostgreSQL on port 5432.
2. **Step-by-Step Flow:**
   - **Step 1 (0:00 - 0:45):** Learner views Dashboard (Balance: 100 credits, Level 1). Searches for "Spring Boot", opens Mentor's profile, and views available slots.
   - **Step 2 (0:45 - 1:20):** Learner clicks 'Book Session'. Evaluator observes Learner credit balance update from **100 $\rightarrow$ 90** immediately.
   - **Step 3 (1:20 - 1:55):** In the Mentor window, the notification bell illuminates in real time (`SESSION_UPDATE`). Mentor views the request under Sessions and clicks **Accept**.
   - **Step 4 (1:55 - 2:40):** With the session accepted, both users open the chat widget. Learner sends a message; Mentor receives it via STOMP WebSockets and types a reply, demonstrating the live typing indicator.
   - **Step 5 (2:40 - 3:15):** Learner marks the session as complete early. Mentor's balance increases by +10 credits (escrow release), and both users receive +20 XP.

### Backup Demo (Contingency: 1:30)
If the dual-browser layout encounters issues or time is short:
- **Single-Window Bot Demonstration:**
  - The backend includes `DemoBotService` (`@ConditionalOnProperty(name = "demo.bot.enabled", havingValue = "true")`).
  - Book a session with `bot@skillshare.com`. The background bot automatically accepts the session within 15 seconds, triggering the notification bell and credit escrow lock in a single browser window.

### Presentation-Day Preflight Checklist
Execute 15 minutes before the evaluation:
1. Start PostgreSQL 16 on port 5432; verify database connectivity.
2. Start backend: `./mvnw spring-boot:run` (confirm `Started SkillshareBackendApplication`).
3. Start frontend: `npm run dev` (confirm `VITE v... ready on http://localhost:5173/`).
4. Log into Learner account in Chrome standard window.
5. Log into Mentor account in Chrome Incognito window.
6. Verify Learner balance is at least 10 credits and Mentor has at least one open availability slot.
7. Keep a secondary terminal open in `qa/postman/` ready to run Newman CLI if live browsers fail.

---

## 6. Testing Evidence

### Exact Verified Testing Numbers
- **Backend Test Count:** Exactly **207 automated tests**, **0 failures**, **0 errors**, **0 skipped**.
- **Test Frameworks:** JUnit 5, Mockito, Spring Boot Test (`@SpringBootTest`, `@WebMvcTest`).
- **API Regression Count:** Exactly **18 requests**, **30 assertions**, **100% pass rate** via Newman.
- **Frontend Test Count:** Exactly **3 unit tests** passing in Vitest (`api.test.ts`, `example.test.ts`).
- **Compilation:** **0 TypeScript errors** (`tsc --noEmit`).

### Test Distribution by Engineering Tier

```text
Backend Test Distribution (207 Tests Total)
├── Service Logic & Concurrency:
│   ├── SessionServiceTest: 31 test methods (credit bounds, atomic booking, cancellation penalties)
│   ├── SessionExpirationProcessorTest: 11 test methods (timeout calculation, refund triggers)
│   ├── SessionExpirationSchedulerTest & ContextTest: 4 test methods
│   └── ChatAuthorizationServiceTest: 5 test methods (friendship & session authorization rules)
├── Web Layer & Security (MockMvc):
│   ├── AdminControllerSecurityTest: 403 Forbidden checks for non-admin users
│   ├── ApiSecurityTest: 401 Unauthorized checks for unauthenticated access
│   ├── OwnershipSecurityTest: Prevents modifying peer availability or session data
│   ├── AvailabilityControllerTest: Overlap detection and slot creation rules
│   ├── SessionControllerTest & SessionControllerSecurityTest
│   ├── ChatControllerTest & ChatRestControllerTest
│   ├── AuthenticationControllerTest, ConnectionControllerTest, FeedbackControllerTest, NotificationControllerTest
│   └── DtoValidationTest: Jakarta validation constraints (@NotNull, @Size)
└── Persistence Integrity:
    ├── PersistenceIntegrityTest: Composite key and foreign key constraint validations
    └── PostgresIntegrationSmokeIT: Real PostgreSQL connection test
```

---

## 7. Customer Feedback $\rightarrow$ Implementation

The following concrete adjustments were implemented based on peer review and testing feedback:

| # | User Feedback & Pain Point | Problem Identified | Implementation Response | Verification Status |
|---|---|---|---|---|
| **1** | *"A recurring weekly timetable does not work for university students because our lab schedules change every two weeks."* | Rigid recurring weekly availability led to frequent cancellations and missed sessions. | Refactored `AvailabilityController` and `AvailabilityService` to support discrete, custom date-time slots. | **VERIFIED** in codebase (`Availability.java`, `AvailabilityController.java`). |
| **2** | *"Mentors were concerned that dissatisfied learners might leave unfair 1-star reviews if they struggled with course concepts."* | Unilateral rating systems create negative incentives and discourage students from mentoring difficult subjects. | Implemented a reciprocal **Dual-Feedback Model** in `FeedbackService.java` requiring ratings and structured tags from both parties. | **VERIFIED** in codebase (`Feedback.java`, `FeedbackService.java`). |
| **3** | *"Learners feared that their 10 credits would be trapped if a mentor forgot to accept or reject their request."* | Pending session requests had no expiration mechanism, leaving credits in escrow indefinitely. | Built `SessionExpirationProcessor.java` and `SessionExpirationScheduler.java` to auto-expire stale requests and refund credits. | **VERIFIED** in codebase (`SessionExpirationProcessor.java`). |

> [!NOTE]
> **Action Item for Viva:** The raw survey responses and interview notes from peer testing are not committed in the Git repository and should be brought by the team as physical printouts or digital sheets.

---

## 8. Original Plan $\rightarrow$ Final State

| Subsystem | Originally Planned Feature | Milestone 4 Delivered State | Status | Engineering Rationale |
|---|---|---|---|---|
| **Authentication** | Username/password login. | Local JWT authentication + GitHub OAuth2 login + Admin Account Freeze. | **COMPLETED (ENHANCED)** | Added OAuth2 for fast student onboarding and account freeze for moderation. |
| **Matchmaking** | Circular "Skill-Cycle" graph algorithm ($A \rightarrow B \rightarrow C \rightarrow A$). | Decentralized 10-Credit Economy with category and skill search. | **PIVOTED / COMPLETED** | Graph matching suffered from scheduling deadlocks. Credit economy provided immediate flexibility. |
| **Scheduling** | 1-on-1 session scheduling. | Full 1-on-1 lifecycle (Request, Accept, Reject, Cancel, Complete) + auto-expiration. | **COMPLETED** | Fully implemented and verified. |
| **Messaging** | Text messaging between students. | Full-duplex STOMP WebSockets with channel interception and typing indicators. | **COMPLETED (ENHANCED)** | Upgraded from HTTP polling to WebSockets for real-time delivery. |
| **Gamification** | Planned points/badges. | XP engine, level calculation, atomic level increments, and live Leaderboard. | **COMPLETED** | Built into database-level atomic queries. |
| **Administration** | Conceptual moderation dashboard. | Admin portal: user management, freeze/unfreeze toggles, report review. | **COMPLETED** | Secured via `@PreAuthorize("hasRole('ADMIN')")`. |
| **Group Sessions** | Multi-student study sessions. | **Not included in Milestone 4 release.** | **DEFERRED (FUTURE)** | Kept M4 focused on 1-on-1 transactional integrity; multi-user escrow deferred to future work. |
| **Course Pool** | Integration with university course catalog. | Tag-based skill categorization without formal university API scraping. | **DEFERRED (FUTURE)** | University registrar APIs were not accessible during the project period. |

---

## 9. Challenges $\rightarrow$ Solutions

### 1. Concurrency Race Conditions on Credit Balance
- **Challenge:** Rapid duplicate clicks on the booking button could read the same balance twice before deduction, allowing a student with 10 credits to book two sessions and end up with -10 credits.
- **Root Cause:** Standard JPA `findById()` followed by `save()` creates a read-modify-write race condition unless synchronized or locked.
- **Engineering Solution:** Implemented an atomic conditional update directly in `UserRepository`:
  ```sql
  UPDATE User u SET u.credits = u.credits - :amount 
  WHERE u.id = :userId AND u.credits >= :amount
  ```
  The database engine executes row-level locking. If the user has fewer than 10 credits, exactly 0 rows are updated, and the application throws an immediate `IllegalStateException`, rolling back the transaction.
- **Status:** **VERIFIED** via `SessionServiceTest.testBookSession_InsufficientCredits`.

### 2. Securing WebSockets Against Sender Spoofing
- **Challenge:** Standard Spring Security HTTP filters only run during the initial HTTP handshake. Once connected, clients sending STOMP frames over WebSockets could theoretically put a forged `senderId` in the JSON payload.
- **Engineering Solution:** Implemented `WebSocketAuthInterceptor` as a `ChannelInterceptor` inspecting the initial `StompCommand.CONNECT` frame to validate the JWT and attach the authenticated principal. In `ChatController`, the server overrides the DTO's sender ID using `principal.getName()`, ensuring the sender identity is always derived from the validated token.
- **Status:** **VERIFIED** via `WebSocketAuthInterceptor.java` and `ChatController.java`.

### 3. JPA LazyInitializationException During DTO Serialization
- **Challenge:** Calling REST endpoints returning sessions sometimes resulted in `LazyInitializationException: could not initialize proxy - no Session` when Jackson tried to serialize lazily-loaded associations (`session.getLearner()`).
- **Engineering Solution:** Implemented explicit DTO mapping (`toDto()`) called *inside* the `@Transactional` boundary of `SessionService`. This ensures all required associations are loaded while the Hibernate session is active.
- **Status:** **VERIFIED** via `SessionService.java`.

---

## 10. Team Collaboration Evidence

### Verifiable Git Collaboration Metrics
- **Total Commits on `main`:** Exactly **342 commits**.
- **Contributors:** 4 team members with active contributions across the repository:
  - **Irusha Bandara (180 commits):** Spring backend architecture, JWT security filter, WebSocket interceptor, JPA repositories, atomic SQL queries, database constraints.
  - **Poorna Gamage (78 commits):** Frontend application structure, React contexts (`AuthContext`, `ChatContext`), STOMP client integration, dashboard, schedule, and session UI.
  - **Hiruni Weerasinghe (49 commits):** Backend unit tests with JUnit 5 and Mockito, Postman/Newman automated API regression collection and assertions.
  - **Sashika Rathnayake (35 commits):** Gamification service, feedback review engine, requirements documentation, and project deliverables.
- **Feature Branches:** Verifiable feature branches in repository history (`chatsystem`, `creditscore`, `demoBot`, `feedbackerror`, `friendreq`, `jwtAdvanced`, `qa-testing`, `sessionCancellation`, `tokenexpire`).

---

## 11. Professional Deliverables

| Deliverable | Repository / Published Location | Verification Status | Notes |
|---|---|---|---|
| **User Manual** | `docs/` | **VERIFIED** | Covers onboarding, profile creation, search, booking, chat, and feedback. |
| **Developer Guide** | `docs/` & `README.md` | **VERIFIED** | Contains prerequisites, local environment setup, build steps, and API details. |
| **API Test Suite** | `qa/postman/SkillShare-API.postman_collection.json` | **VERIFIED** | 18 requests and 30 automated assertions executable via Newman CLI. |
| **Functional Requirements** | `docs/functional-requirements.md` | **VERIFIED** | Documents FR-01 through FR-15 aligned with released functionality. |
| **Non-Functional Specs** | `docs/non-functional-requirements.md` | **VERIFIED** | Documents NFR-01 through NFR-10 covering security, reliability, and usability. |
| **Database ER Model** | `docs/database-er-model.md` | **VERIFIED** | Includes Mermaid entity-relationship diagram and constraint mapping. |
| **Project Web Page** | `https://cepdnaclk.github.io/e23-co2060-SkillShare/` | **VERIFIED** | Published on GitHub Pages with project theme. |
| **GitHub Repository** | `https://github.com/cepdnaclk/e23-co2060-SkillShare.git` | **VERIFIED** | Clean `main` branch with no untracked files or compilation errors. |
| **Customer Feedback** | Physical / Digital sheets (Google Forms) | **NEEDS VERIFICATION** | Must be brought to viva (not committed in Git). |

---

## 12. Evidence Gaps / Required Preparation

The following items are not committed inside the Git repository and must be prepared by the team prior to the presentation:

> [!IMPORTANT]
> 1. **Customer Feedback Artifacts:** Have a printout or digital copy of the original Google Form survey responses and student testing notes ready to show during the viva.
> 2. **Environment Preflight:** Verify that PostgreSQL is running locally and test accounts (`learner@skillshare.com`, `mentor@skillshare.com`) are ready with expected credit balances before presenting.
> 3. **Offline Demo Recording:** Keep a recorded video of the dual-browser interaction on a USB drive as an offline backup in case of presentation machine display issues.

---

## 13. Likely Viva Questions & Concrete Technical Answers

### Architecture & System Design
1. **Q: Why did you choose a decoupled React + Spring Boot architecture over a server-rendered setup?**  
   *Answer:* A decoupled SPA architecture allows our React client to handle both stateless REST requests and full-duplex WebSocket STOMP connections independently. It allows fast client-side navigation without full-page reloads and provides a clear separation between frontend presentation and backend business logic.  
   *Evidence:* `SecurityConfig.java`, `WebSocketConfig.java`, `App.tsx`.

2. **Q: Why was the initial "Skill-Cycle" matchmaking algorithm replaced?**  
   *Answer:* The Skill-Cycle concept required finding closed 3-way or multi-way matching loops ($A \rightarrow B \rightarrow C \rightarrow A$). In practice, students' conflicting timetables made finding mutually compatible times exceedingly difficult, and a single cancellation broke the entire chain. Moving to an internal credit economy decoupled teaching from learning, allowing students to mentor when available and learn when needed.  
   *Evidence:* `docs/README.md:L60-66`.

### Backend & Concurrency
3. **Q: How does the system prevent two students from booking the same mentor availability slot simultaneously?**  
   *Answer:* In `SessionService.bookSession()`, the slot reservation executes an atomic query via `availabilityRepository.reserveAvailabilityAtomically(slotId, sessionId)`. The query checks `WHERE id = :slotId AND isBooked = false`. If two requests arrive concurrently, the database row lock allows only one update to return 1; the other returns 0 and throws an `IllegalStateException`, rolling back the transaction.  
   *Evidence:* `AvailabilityRepository.java`, `SessionService.java:L135-145`.

4. **Q: How are credit deductions protected against race conditions and negative balances?**  
   *Answer:* Instead of reading the balance into Java, subtracting 10, and saving, `UserRepository.deductCreditsIfSufficient` runs an atomic SQL update: `UPDATE users SET credits = credits - :amount WHERE id = :userId AND credits >= :amount`. The condition `credits >= :amount` is evaluated by the database engine at row level. If the user has fewer than 10 credits, zero rows are affected, triggering a rollback.  
   *Evidence:* `UserRepository.java:L52-61`, `SessionServiceTest.java:L145-165`.

5. **Q: What happens if a mentor ignores a session request and never accepts or rejects it?**  
   *Answer:* `SessionExpirationScheduler` runs a background task that calls `SessionExpirationProcessor.processPendingExpiration()`. It queries pending sessions where the start time has arrived or the request has timed out, transitions the status to `EXPIRED`, releases the availability slot, and runs `userRepository.addCreditsAtomically(learnerId, 10)` to automatically refund the learner.  
   *Evidence:* `SessionExpirationProcessor.java:L33-72`.

6. **Q: Can a session be completed early if the tutoring finishes ahead of schedule?**  
   *Answer:* Yes. `SessionService.completeSession()` allows the learner to mark an `ACCEPTED` session as `COMPLETED` early. This releases the 10 escrow credits to the mentor and awards XP immediately. However, automatic completion via `SessionExpirationProcessor` only triggers after `endTime` has passed.  
   *Evidence:* `SessionService.java:L321-359`, `qa/postman/README.md:L57-60`.

### Security & Authentication
7. **Q: How are WebSockets secured when STOMP frames bypass standard HTTP servlet filters?**  
   *Answer:* We implemented `WebSocketAuthInterceptor` as a Spring `ChannelInterceptor`. It intercepts the STOMP `CONNECT` frame, extracts the Bearer token from native headers, validates the signature via `JwtService`, loads the `UserDetails`, and sets the authenticated `UsernamePasswordAuthenticationToken` in the WebSocket session.  
   *Evidence:* `WebSocketAuthInterceptor.java:L26-60`.

8. **Q: What prevents a student from messaging arbitrary users on the platform?**  
   *Answer:* When a message is sent to `/app/chat`, `ChatAuthorizationService.isAuthorizedToChat(senderId, receiverId)` verifies that the two users either have an accepted connection (`ConnectionStatus.ACCEPTED`) or share an existing learning session. In addition, `ChatController` derives the `senderId` directly from the authenticated principal to prevent spoofing.  
   *Evidence:* `ChatAuthorizationService.java:L22-39`, `ChatController.java:L36-49`.

9. **Q: How does the Account Freeze mechanism work?**  
   *Answer:* Administrators can toggle `User.isActive`. During login, `AuthenticationService` checks `user.isEnabled()`, rejecting suspended users. In `SessionService.bookSession()`, the system checks `mentor.getIsActive()`, preventing bookings with frozen accounts.  
   *Evidence:* `AuthenticationService.java:L78-88`, `SessionService.java:L98-100`.

### Database & Relational Design
10. **Q: Why use a composite primary key for `UserSkill` instead of a surrogate UUID?**  
    *Answer:* `UserSkillId` combines `userId`, `skillId`, and `skillType`. This enforces at the database level that a user cannot add the same skill twice under the same designation (`TEACH` or `LEARN`), preventing duplicate skill records.  
    *Evidence:* `UserSkillId.java`, `UserSkill.java`, `docs/database-er-model.md`.

11. **Q: How did you prevent `LazyInitializationException` when returning sessions from REST controllers?**  
    *Answer:* In `SessionService`, our `toDto()` method maps the `Session` entity to a `SessionResponse` DTO *inside* the `@Transactional` service boundary. This ensures that lazy associations (`session.getLearner()`, `session.getSkill()`) are resolved while the Hibernate session is open, rather than during Jackson JSON serialization.  
    *Evidence:* `SessionService.java:L57-78`.

### Testing & Quality Assurance
12. **Q: What did your 207 backend tests cover?**  
    *Answer:* They cover service business logic (booking, cancellation, penalties), concurrency constraints, MockMvc controller endpoints, security authorization (401/403 responses), DTO validation, and database integrity constraints.  
    *Evidence:* `code/skillshare-backend/src/test/`.

13. **Q: What is the purpose of the Newman suite in `qa/postman`?**  
    *Answer:* Newman runs 18 integration requests against the running application server, verifying the actual HTTP request/response pipeline, JSON serialization, database persistence, and multi-step workflows (login $\rightarrow$ create availability $\rightarrow$ book session $\rightarrow$ accept) in an automated, headless execution.  
    *Evidence:* `qa/postman/README.md`, `qa/postman/SkillShare-API.postman_collection.json`.

---

## 14. Final Timing Plan

```text
┌───────┬──────────────────────────────────────────┬──────────┬──────────────────┐
│ Slide │ Topic / Presentation Segment             │ Duration │ Speaker          │
├───────┼──────────────────────────────────────────┼──────────┼──────────────────┤
│ 1     │ Problem Space & SkillShare Paradigm      │ 0:45     │ Irusha Bandara   │
│ 2     │ Decoupled Full-Stack Architecture        │ 1:00     │ Poorna Gamage    │
│ 3     │ Critical Engineering: Concurrency & Auth │ 1:15     │ Irusha Bandara   │
│ 4     │ Challenges & System Evolution            │ 1:00     │ Sashika Rathnayake│
│ 5     │ LIVE FINAL PRODUCT DEMONSTRATION         │ 3:15     │ Poorna & Irusha  │
│ 6     │ Testing & Collaboration Evidence         │ 1:00     │ Hiruni Weerasinghe│
│ 7     │ Customer Feedback → Implementation       │ 0:50     │ Sashika Rathnayake│
│ 8     │ Final State & Deliverables               │ 0:45     │ Irusha / All     │
├───────┼──────────────────────────────────────────┼──────────┼──────────────────┤
│ TOTAL │ Presentation + Live Demonstration        │ 9:50     │ All Members Speak│
│ BUFFER│ Safety Buffer Before 10:00 Limit         │ 0:10     │                  │
└───────┴──────────────────────────────────────────┴──────────┴──────────────────┘
```

- **Pacing Rule:** The transition to the live demo starts at minute 4:00. The demo concludes at minute 7:15, leaving 2:35 for testing, feedback, deliverables, and conclusion.
- **Viva:** 5:00 minutes reserved for examiner questions.

---

## 15. Slide Creation Guidelines

When building the slide deck in Google Slides or PowerPoint:
1. **Visual Simplicity:** Use a dark theme (`#0F172A`) or clean light theme. Use sans-serif typography (`Inter`, `Roboto`, or `Plus Jakarta Sans`).
2. **Visual Anchors:** Use 2-column or 3-column cards with bold headers and short bullet points. Avoid paragraphs of text.
3. **Architecture Diagrams:** Keep diagrams simple with clear directional arrows for REST and STOMP channels.
4. **Code Callouts:** Show only short, 2-line snippets (such as the atomic SQL query) to explain concepts; never paste entire methods.
5. **Separation of Content:** Remember that the slide displays the structure (`ON SLIDE`), while the speaker provides the technical explanation (`SPEAKER EXPLAINS`).

---
*SkillShare Milestone 4 Master Presentation Blueprint (Version 2 Refinement) — Team ZenWare.*
