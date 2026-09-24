# SkillShare

A university-oriented peer-to-peer skill-sharing platform developed by ZenWare that allows students to discover skills, share knowledge, arrange individual learning sessions, exchange credits, communicate with peers, and build reputation/progress.

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## Overview

In many university environments, students possess valuable skills but lack a structured way to share them. SkillShare addresses this by providing a centralized peer-to-peer network. Rather than relying on complex automatic matching, users can search for skills, book individual sessions with mentors using an internal credit economy, and leave feedback to build a reliable campus community.

## Key Features

### Authentication & Profiles
- Local authentication
- OAuth2 (GitHub)
- User profiles
- Profile images

### Skills & Discovery
- Skill management
- Teach/Learn roles
- Skill discovery/search

### Availability & Sessions
- Mentor availability
- Individual session booking
- Accept/reject
- Cancellation
- Completion

### Credit & Reputation
- Credit-based exchange
- Feedback
- Reputation
- XP / levels

### Communication
- Real-time chat
- Notifications
- Connections

## Technology Stack

| Component | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite |
| **Backend** | Java, Spring Boot |
| **Database** | PostgreSQL, JPA/Hibernate |
| **Security** | Spring Security, JWT, OAuth2 |
| **Real-time** | WebSocket, STOMP |
| **Storage** | Cloudinary |
| **Testing** | JUnit, Spring Boot Test, Vitest, React Testing Library, Postman/Newman |

## System Architecture

The system follows a modern decoupled architecture:

```text
User
  ↓
React + TypeScript + Vite
  ↓
REST / HTTP and WebSocket / STOMP
  ↓
Spring Boot Backend
  ↓
REST Controllers / WebSocket Endpoint
  ↓
Application / Business Services
  ↓
JPA Repositories
  ↓
PostgreSQL
```

External integrations include GitHub OAuth2 for authentication and Cloudinary for image storage.

## Project Structure

```text
e23-co2060-SkillShare/
├── code/
│   ├── skillshare-backend/
│   └── skillshare-frontend-new/
├── docs/
├── qa/
│   └── postman/
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Java 21
- PostgreSQL

### Frontend Setup
```bash
cd code/skillshare-frontend-new
npm install
npm run dev
```

### Backend Setup
1. Create a PostgreSQL database.
2. Supply the required environment variables, such as JWT secret, database credentials, OAuth client secrets, and Cloudinary configuration.
3. Run the Spring Boot application using Maven.

Linux/macOS:
```bash
cd code/skillshare-backend
./mvnw spring-boot:run
```

Windows:
```cmd
cd code\skillshare-backend
mvnw.cmd spring-boot:run
```

## Testing

The project includes automated backend testing and API-level integration/regression testing.

**Backend Automated Testing**
- 199 tests
- 0 failures
- 0 errors
- 0 skipped

**API Integration Testing (Postman/Newman)**
- Located in `qa/postman/`
- 18 requests
- 30 assertions
- 100% pass rate
- Execution time: ~1.5 seconds

## Documentation

Detailed project documentation is available in the `docs/` directory.

## Team

- E/23/035, Irusha Bandara, [e23035@eng.pdn.ac.lk](mailto:e23035@eng.pdn.ac.lk)
- E/23/104, Poorna Gamage, [e23104@eng.pdn.ac.lk](mailto:e23104@eng.pdn.ac.lk)
- E/23/430, Hiruni Weerasinghe, [e23430@eng.pdn.ac.lk](mailto:e23430@eng.pdn.ac.lk)
- E/23/317, Sashika Rathnayake, [e23317@eng.pdn.ac.lk](mailto:e23317@eng.pdn.ac.lk)
