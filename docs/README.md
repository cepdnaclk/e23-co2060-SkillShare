---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: eYY-co2060-project-template
title: Project Template
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template, and add more information required for your own project"

<!-- Once you fill the index.json file inside /docs/data, please make sure the syntax is correct. (You can use this tool to identify syntax errors)

Please include the "correct" email address of your supervisors. (You can find them from https://people.ce.pdn.ac.lk/ )

Please include an appropriate cover page image ( cover_page.jpg ) and a thumbnail image ( thumbnail.jpg ) in the same folder as the index.json (i.e., /docs/data ). The cover page image must be cropped to 940×352 and the thumbnail image must be cropped to 640×360 . Use https://croppola.com/ for cropping and https://squoosh.app/ to reduce the file size.

If your followed all the given instructions correctly, your repository will be automatically added to the department's project web site (Update daily)

A HTML template integrated with the given GitHub repository templates, based on github.com/cepdnaclk/eYY-project-theme . If you like to remove this default theme and make your own web page, you can remove the file, docs/_config.yml and create the site using HTML. -->

# Skill-Share by ZenWare

---

## Team
-  E/23/035, Irusha Bandara, [email](e23035@eng.pdn.ac.lk)
-  E/23/104, Poorna Gamage, [email](e23104@eng.pdn.ac.lk)
-  E/23/430, Hiruni Weerasinghe, [email](e23430@eng.pdn.ac.lk)
-  E/23/317, Sashika Rathnayake, [email](e23317@eng.pdn.ac.lk)

<!-- Image (photo/drawing of the final hardware) should be here -->

<!-- This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/) -->

<!-- ![Sample Image](./images/sample.png) -->

#### Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture )
3. [Software Designs](#hardware-and-software-designs)
4. [Testing](#testing)
5. [Conclusion](#conclusion)
6. [Links](#links)

## Introduction

In today’s academic environments, students often possess valuable skills but lack a structured way to share them, leading to underutilized peer knowledge. Current methods for finding mentors or study partners are inefficient, relying on manual coordination and failing to solve complex scheduling conflicts. Skill-Share by ZenWare addresses this by providing a campus-oriented, full-stack platform that uses smart algorithms to connect students.

The solution goes beyond simple searching; it identifies multi-user "skill cycles" (where Student A teaches B, and B teaches C) and automatically syncs free time slots to eliminate scheduling headaches. By integrating a Trust Score System and real-time communication, it builds a reliable learning community.

The impact is a more connected university ecosystem where learning is accessible and collaborative. It empowers students to trade knowledge as a resource, reducing reliance on expensive external tutoring and maximizing the collective potential of the student body.


## Solution Architecture

<img width="1050" height="809" alt="Screenshot 2026-05-02 000315" src="https://github.com/user-attachments/assets/c61676d3-8b57-4870-82f2-814d144d4b16" />

The platform is engineered to solve a specific campus problem: the "hidden" skills of university students. The architecture transitions users from an inefficient "As-Is" state (relying on WhatsApp, paid materials, or unreliable AI) to a secure, centralized peer-to-peer network. At a high level, the system utilizes JWT authentication for secure access, connecting users through a live auto-suggest search engine (by user or skill) and managing interactions via an automated availability and notification system.

## Software Designs

Our software design centers on empowering the user rather than forcing automated matches. We originally designed a "Skill-Cycle" algorithm, but identified critical edge cases: unacceptable wait times, infinite relationship loops, and the restriction that a user must both teach and learn. To resolve this, we pivoted to a decentralized Credit and Reputation Economy.

* **Core Mechanics:** Users manage their own availability and book individual sessions.
* **The Economy:** To learn a skill, users spend credits. To earn credits, they are incentivized to teach others. This gamifies the peer-to-peer process and completely eliminates the bottleneck of waiting for a perfect "match cycle."
* **Two-Way Feedback:** Completed sessions use a dual-feedback submission design to calculate a reliable user reputation score.

### System Use Case Diagram
<img width="508" height="606" alt="Screenshot 2026-07-22 110720" src="https://github.com/user-attachments/assets/115b953f-cd20-4af0-8f51-a6e5254b1ff4" />

### System Class Diagram
<img width="1907" height="670" alt="Screenshot 2026-07-22 110657" src="https://github.com/user-attachments/assets/ff3a2f81-3c35-46f8-b7c6-5e1bbaef344c" />

## Testing 
### 1. Phase - 1

Testing focused heavily on our core custom logic and security. We executed comprehensive unit and integration tests to ensure that our JWT security filters, real-time Notification system, and complex Credit Score economy (ensuring credits are correctly deducted or awarded during bookings) functioned flawlessly under various edge cases.

<img width="762" height="837" alt="Screenshot 2026-05-01 221729" src="https://github.com/user-attachments/assets/2f291361-5384-40e3-83cb-77671e641d42" /> 
<img width="760" height="486" alt="Screenshot 2026-05-02 002009" src="https://github.com/user-attachments/assets/d2f676b9-d23f-4ddb-b578-1d6be3239b98" />

### 2. Phase - 2
This section summarizes the automated testing that has been implemented and executed within the **SkillShare** system. The project is divided into a Java Spring Boot backend (`skillshare-backend`) and a React TypeScript frontend (`skillshare-frontend-new`). Both systems contain foundational test setups, with focused unit tests on critical business logic for the backend and API interaction mocks for the frontend.

### 1. Backend Testing (`skillshare-backend`)
The backend testing utilizes **JUnit 5** and **Mockito** for unit and integration testing.

#### Existing Tests
1. **`SessionServiceTest.java`**: 
   * A dedicated unit test for the `SessionService` business logic.
   * **Mocks Used**: `SessionRepository`, `UserRepository`, `SkillRepository`, `AvailabilityRepository`, `NotificationService`, and `SecurityContextHolder`.
   * **Test Cases Covered**:
     * `testBookSession_Success`: Validates that a session is successfully booked, user credits are deducted (-10), availability is marked as booked, and a notification is sent to the mentor.
     * `testBookSession_InsufficientCredits`: Asserts that an `IllegalStateException` is thrown if a learner tries to book a session with insufficient credits (e.g., 5 credits).
     * `testCompleteSession_BeforeEndTime`: Asserts that a session cannot be completed prematurely before its scheduled end time.

2. **`SkillshareBackendApplicationTests.java`**:
   * A standard Spring Boot integration test that verifies the application context loads successfully without dependency injection failures.

### 2. Frontend Testing (`skillshare-frontend-new`)
The frontend testing is powered by **Vitest**, an extremely fast unit-testing framework tailored for Vite-based projects.

#### Existing Tests
1. **`api.test.ts`** (`src/lib/api.test.ts`):
   * Tests the `usersApi.getMe()` function.
   * **Mocks Used**: Global `fetch` API is mocked using `vi.fn()` to prevent real network requests. `localStorage` is mocked to simulate JWT token retrieval.
   * **Test Cases Covered**:
     * *Success Path*: Verifies that the `/api/users/me` endpoint is called with the correct `Authorization` and `Content-Type` headers, successfully parsing and returning the mock user object.
     * *Error Path*: Verifies that the function correctly throws an `ApiError` when the server responds with a `401 Unauthorized` status.

2. **`example.test.ts`** (`src/test/example.test.ts`):
   * A foundational boilerplate test ensuring the Vitest environment is correctly configured and operational.

#### Test Execution Results
The frontend test suite was executed successfully with the following results:
```
 ✓ src/test/example.test.ts (1 test) 2ms
 ✓ src/lib/api.test.ts (2 tests) 4ms

 Test Files  2 passed (2)
      Tests  3 passed (3)
   Duration  1.48s
```
### 3. Recommendations & Next Steps

**Backend Next Steps:**
* Expand test coverage to other core services like `UserService` and `GamificationService`.
* Add integration/controller tests (e.g., `MockMvc`) for `FeedbackController` and `SessionController` to ensure API endpoints return correct HTTP statuses.

**Frontend Next Steps:**
* Introduce **React Testing Library** to test UI components. Currently, components like `CreateProfile.tsx` and `ViewProfile.tsx` lack render and interaction tests.
* Add E2E (End-to-End) testing using **Playwright** or **Cypress** to test the entire user flow from authentication to session booking.

## Conclusion

Having successfully delivered our MVP, we have aggressively expanded Skill-Share into a feature-rich, production-ready architecture. 

* **Core Foundation Achieved:** We established a secure, robust platform featuring standard authentication, user dashboards, live skill searching, individual session booking, a custom credit/reputation economy, and a dual-feedback system. 
* **Final Product Capabilities (Milestone 3):** Moving beyond the MVP, we successfully engineered and integrated advanced systems, including a real-time STOMP WebSocket Chat infrastructure, an atomic Gamification Engine (XP, Leveling, and Trending Leaderboards), a peer-to-peer Friend Request network, secure profile picture uploads with Zero-Trust validation, and seamless OAuth2 integration.
* **Future Roadmap & Deployment:** As we finalize the product, our immediate focus shifts towards deploying the full-stack architecture to live cloud environments. Further ecosystem expansions will include Group Sessions, a Course Pool, deeper Google Workspace integrations (e.g., Calendar syncing), and a dedicated Admin authorization tier to manage the platform at scale.

## Links

- [Project Repository](https://github.com/cepdnaclk/e23-2YP-SkillShare.git)
- [Project Page](https://cepdnaclk.github.io/e23-2YP-SkillShare/)
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
