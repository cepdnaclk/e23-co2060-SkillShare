import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { AdminOverviewDto, AdminSessionDto, AdminUserDto, Skill, UserRole } from "./types";

export const adminApi = {
  getOverview: () =>
    apiFetch<AdminOverviewDto>(API_ROUTES.ADMIN_OVERVIEW),

  getUsers: (q = "") =>
    apiFetch<AdminUserDto[]>(`${API_ROUTES.ADMIN_USERS}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`),

  updateUser: (userId: string, payload: { role?: UserRole; isActive?: boolean }) =>
    apiFetch<AdminUserDto>(API_ROUTES.adminUserById(userId), {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getSkills: () =>
    apiFetch<Skill[]>(API_ROUTES.ADMIN_SKILLS),

  createSkill: (name: string, category: string) =>
    apiFetch<Skill>(API_ROUTES.ADMIN_SKILLS, {
      method: "POST",
      body: JSON.stringify({ name, category }),
    }),

  deleteSkill: (skillId: string) =>
    apiFetch<void>(API_ROUTES.adminSkillById(skillId), { method: "DELETE" }),

  getSessions: () =>
    apiFetch<AdminSessionDto[]>(API_ROUTES.ADMIN_SESSIONS),
};
