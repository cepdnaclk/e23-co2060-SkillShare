import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { Skill } from "./types";

export const skillsApi = {
  search: (q: string) =>
    apiFetch<Skill[]>(`${API_ROUTES.SKILLS_SEARCH}?q=${encodeURIComponent(q)}`),

  add: (name: string, category: string) =>
    apiFetch<Skill>(API_ROUTES.SKILLS_ADD, {
      method: "POST",
      body: JSON.stringify({ name, category }),
    }),
};
