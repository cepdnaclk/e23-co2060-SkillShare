# Skill-Share by ZenWare

## Project Overview

Skill-Share is an algorithm-driven peer-to-peer knowledge and resource sharing platform designed for university students. The platform enables users to connect, collaborate, and exchange skills efficiently using intelligent matching and scheduling mechanisms.

This project is developed as part of the CO2060 Software Design and Development module.

---

## Key Features

- 🔄 **Skill-Cycle Matching**  
  Detects multi-user learning cycles (A → B → C → A) using graph-based algorithms.

- ⏰ **Smart Scheduling**  
  Identifies overlapping free time slots among multiple users.

- 📊 **Mentor Queue System**  
  Manages mentoring requests using priority-based queuing.

- 🔍 **Search & Discovery**  
  Real-time search suggestions and trending skills detection.

- 📍 **Nearest User Discovery**  
  Finds nearby users using spatial data structures.

- 💬 **Real-Time Chat**  
  Enables instant communication between users.

- ⭐ **Trust Score System**  
  Evaluates mentor reliability based on user interactions.

---

## Tech Stack

**Frontend**
- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn-ui

**Backend**
- Spring Boot (Java)

**Database**
- PostgreSQL

**Other Technologies**
- WebSockets (real-time communication)
- JWT Authentication

---

## Getting Started

### Prerequisites
- Node.js & npm installed

### Setup

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate into the project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Run the development server
npm run dev