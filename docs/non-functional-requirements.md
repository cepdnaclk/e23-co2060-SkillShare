# SkillShare — Non-Functional Requirements Specification

*These requirements are derived from the released architecture and implementation of the Milestone 4 system.*

## NFR-01 Security
- **ID**: NFR-01
- **Requirement**: All communication must be securely authenticated and authorized, with user passwords securely hashed.
- **Implementation Evidence**: JWT-based stateless authentication (`AuthTokenFilter.java`), BCrypt password hashing (`SecurityConfig.java`), zero-trust WebSocket validation (`ChatAuthorizationService.java`).
- **Verification Method**: Verified via automated backend security tests, API Postman suites, and manual JWT manipulation attempts.

## NFR-02 Performance
- **ID**: NFR-02
- **Requirement**: The system shall respond to typical user interactions swiftly to ensure a smooth user experience.
- **Implementation Evidence**: Frontend optimizations using React Vite, pagination implemented on backend listing endpoints (`Pageable` in Spring Data JPA).
- **Verification Method**: Qualitative manual QA and execution of the API regression suite.

## NFR-03 Reliability
- **ID**: NFR-03
- **Requirement**: The system shall process complex state changes reliably without leaving the application in an inconsistent state.
- **Implementation Evidence**: Database transactions (`@Transactional` in `SessionService.java` and `GamificationService.java`) ensuring atomic credit deduction, session booking, and notification dispatch.
- **Verification Method**: Verified via JUnit testing specifically targeting transaction failures (e.g., `testBookSession_InsufficientCredits`).

## NFR-04 Maintainability
- **ID**: NFR-04
- **Requirement**: The codebase must be structured cleanly to facilitate future enhancements and debugging.
- **Implementation Evidence**: Strict layered architecture (Controller -> Service -> Repository), separated frontend API client mapping (`src/api`), and use of explicit DTOs over entity serialization.
- **Verification Method**: Verified via code review and architectural audits (`docs/mission-19F-12-report.md`).

## NFR-05 Scalability
- **ID**: NFR-05
- **Requirement**: The architecture must support stateless horizontal scaling of the API servers.
- **Implementation Evidence**: Stateless REST API design, JWT usage eliminating server-side session replication, externalized PostgreSQL database.
- **Verification Method**: Architectural verification (the system inherently avoids `HttpSession`).

## NFR-06 Usability
- **ID**: NFR-06
- **Requirement**: The user interface shall be intuitive, responsive, and provide clear error feedback.
- **Implementation Evidence**: Centralized error normalization (`GlobalExceptionHandler.java`), localized client-side toasts, and responsive design utilizing Tailwind CSS.
- **Verification Method**: Verified via Manual QA across different viewport sizes.

## NFR-07 Compatibility
- **ID**: NFR-07
- **Requirement**: The application must operate across standard modern web browsers.
- **Implementation Evidence**: Vite and React 18 configuration targeting modern browsers.
- **Verification Method**: Manual QA and Vitest baseline suite.

## NFR-08 Data Integrity
- **ID**: NFR-08
- **Requirement**: The system must enforce strong relational consistency and data constraints.
- **Implementation Evidence**: PostgreSQL foreign keys, unique constraints (e.g., `sender_id`, `receiver_id` in `CONNECTION`), and JPA Bean Validation annotations (`@NotNull`, `@Size`).
- **Verification Method**: Backend integration tests asserting constraint violations.

## NFR-09 Testability
- **ID**: NFR-09
- **Requirement**: Core business logic must be structurally testable in isolation.
- **Implementation Evidence**: Dependency Injection (Spring IoC) allowing mock injection in services (e.g., `Mockito` in `SessionServiceTest.java`).
- **Verification Method**: Verified through the automated JUnit 5 backend test suite executed during release QA.

## NFR-10 Configurability and Deployment
- **ID**: NFR-10
- **Requirement**: The system must externalize environment-specific configurations.
- **Implementation Evidence**: `application.yml` profiles in Spring Boot and `.env` variables (`VITE_API_URL`) in the Vite frontend.
- **Verification Method**: Verified by successful local and remote environment toggling during QA.
