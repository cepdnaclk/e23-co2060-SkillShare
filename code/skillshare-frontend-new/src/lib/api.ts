// ============================================================
// COMPATIBILITY LAYER
// Re-exports the new modular API for legacy consumers
// to prevent breaking existing UI files.
// TODO: Migrate all UI consumers to use `src/api/*` directly.
// ============================================================

export * from "@/api/auth.api";
export * from "@/api/users.api";
export * from "@/api/skills.api";
export * from "@/api/userSkills.api";
export * from "@/api/availability.api";
export * from "@/api/sessions.api";
export * from "@/api/feedback.api";
export * from "@/api/notifications.api";
export * from "@/api/connections.api";
export * from "@/api/dashboard.api";

// Re-export specific aliases required by UI components
export { skillsApi as publicSkillsApi } from "@/api/skills.api";
export { availabilityApi as myavailabilityApi } from "@/api/availability.api";

import type {
    UserPrivateDto,
    UserSkillDto,
    AvailabilityResponse,
    SessionResponse,
    FeedbackResponse,
    AuthenticationResponse,
} from "@/api/types";
export * from "@/api/types";
export type { ApiError } from "@/api/client";

// Legacy Type Aliases to avoid breaking UI code instantly
export type User = UserPrivateDto;
export type UserSkill = UserSkillDto;
export type Availability = AvailabilityResponse;
export type Session = SessionResponse;
export type Feedback = FeedbackResponse;
export type AuthResponse = AuthenticationResponse;