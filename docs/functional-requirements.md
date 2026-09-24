# SkillShare — Functional Requirements Specification

*These requirements are derived from the functionality implemented in the Milestone 4 release. They represent the final implemented system rather than an earlier proposal.*

## FR-01 Authentication and Account Access
- **ID**: FR-01
- **Requirement**: The system shall allow users to securely register, log in, and log out.
- **Description**: Users can create an account using an email address and password, or authenticate using external OAuth2 providers (GitHub).
- **Main Actors**: Learner, Mentor, Admin
- **Expected System Behavior**: The system validates credentials, establishes a secure JWT-based session, and denies access to unauthenticated or frozen accounts.

## FR-02 Profile Management
- **ID**: FR-02
- **Requirement**: The system shall allow users to manage their personal profile information.
- **Description**: Users can update their biography, academic details, and upload a profile picture which is hosted securely.
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system stores profile updates and retrieves them for public or private display.

## FR-03 Skill Management and Discovery
- **ID**: FR-03
- **Requirement**: The system shall provide capabilities to manage and discover skills.
- **Description**: Users can search for existing skills, view trending skills, and assign skills to their profile with designated roles (Teach or Learn).
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system returns paginated skill search results and successfully associates the selected skills with the user's profile.

## FR-04 Availability Management
- **ID**: FR-04
- **Requirement**: The system shall allow mentors to define their available time slots.
- **Description**: Mentors can create, view, and delete specific time blocks during which they are available to teach.
- **Main Actors**: Mentor
- **Expected System Behavior**: The system persists these time slots and accurately exposes them to learners seeking to book a session.

## FR-05 Individual Learning Session Management
- **ID**: FR-05
- **Requirement**: The system shall facilitate the booking and lifecycle management of individual learning sessions.
- **Description**: Learners can book an available time slot. Mentors can accept or reject the booking. Either party can cancel prior to the session.
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system updates session status (PENDING, ACCEPTED, REJECTED, CANCELLED) and notifies the relevant party.

## FR-06 Credit Economy
- **ID**: FR-06
- **Requirement**: The system shall enforce a credit-based economy for peer-to-peer knowledge exchange.
- **Description**: Booking a session costs a fixed amount of credits. Credits are temporarily held and then awarded to the mentor upon successful completion.
- **Main Actors**: Learner, Mentor, System
- **Expected System Behavior**: The system atomically deducts 10 credits from the learner's balance upon booking, tracks the debt, and transfers it to the mentor upon completion.

## FR-07 Feedback and Reputation
- **ID**: FR-07
- **Requirement**: The system shall collect session feedback and calculate user reputation.
- **Description**: After a session is completed, users leave ratings and descriptive tags.
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system stores dual-feedback and recalculates the user's overall reputation score based on incoming reviews.

## FR-08 Gamification and Progression
- **ID**: FR-08
- **Requirement**: The system shall gamify user participation through Experience Points (XP) and Levels.
- **Description**: Users earn XP for completing sessions and receiving positive feedback. Reaching certain XP thresholds increases their level.
- **Main Actors**: System, Learner, Mentor
- **Expected System Behavior**: The system automatically applies gamification formulas to incoming feedback and updates the user's XP and Level accordingly.

## FR-09 User Connections
- **ID**: FR-09
- **Requirement**: The system shall allow users to build a personal network of connections.
- **Description**: Users can send, accept, and reject friend requests with other peers on the platform.
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system tracks connection states (PENDING, ACCEPTED, REJECTED) and provides lists of accepted friends.

## FR-10 Notifications
- **ID**: FR-10
- **Requirement**: The system shall notify users of important platform events.
- **Description**: Real-time or persistent notifications are generated for session bookings, status changes, and friend requests.
- **Main Actors**: System, Learner, Mentor
- **Expected System Behavior**: The system persists unread notifications, delivers them to the client, and allows users to mark them as read.

## FR-11 Real-Time Chat
- **ID**: FR-11
- **Requirement**: The system shall provide real-time messaging between connected users.
- **Description**: Users can exchange instant messages and see typing indicators.
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system delivers messages securely via WebSockets (STOMP), persists chat history, and manages unread counts.

## FR-12 User Reporting
- **ID**: FR-12
- **Requirement**: The system shall allow users to report inappropriate behavior.
- **Description**: Users can submit reports detailing misconduct by other users, optionally linking to a specific session.
- **Main Actors**: Learner, Mentor
- **Expected System Behavior**: The system records the report for administrative review.

## FR-13 Administrative Management
- **ID**: FR-13
- **Requirement**: The system shall provide administrators with platform oversight tools.
- **Description**: Administrators have access to view all registered users, system-wide sessions, and submitted reports.
- **Main Actors**: Admin
- **Expected System Behavior**: The system exposes privileged endpoints that return system-wide operational data.

## FR-14 Account Freeze / Moderation
- **ID**: FR-14
- **Requirement**: The system shall allow administrators to freeze and unfreeze user accounts.
- **Description**: To moderate the platform, administrators can suspend a user's access, effectively locking them out of the system.
- **Main Actors**: Admin
- **Expected System Behavior**: The system flips the user's active status and subsequently rejects any authentication attempts from that user.

## FR-15 Authorization and Security Controls
- **ID**: FR-15
- **Requirement**: The system shall restrict actions based on user roles and identity.
- **Description**: Users can only modify their own data. Administrative endpoints are strictly fenced off from regular users.
- **Main Actors**: System
- **Expected System Behavior**: The system validates the JWT and verifies that the subject has the required permissions (e.g., `ROLE_ADMIN` or ownership of the resource) before executing actions.

---

## Release Boundary

Explicitly defined boundaries for the Milestone 4 release:
- **Individual peer-to-peer sessions are part of the final release.** The system fully supports 1-on-1 interactions, availability management, and related economic transactions.
- **Group Sessions are NOT part of the Milestone 4 release.** Any reference to multi-participant sessions or course pools in legacy documentation represents isolated future extensions. Do not describe Group Sessions as implemented final functionality within this release candidate.
