import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { UserPublicDto, TrendingSkillDto } from "./types";

export const trendingApi = {
  getTopActiveUsers: () =>
    apiFetch<UserPublicDto[]>(API_ROUTES.TRENDING_LEARNERS),

  getTopMentorsByCategory: (category: string) =>
    apiFetch<UserPublicDto[]>(API_ROUTES.trendingMentorsByCategory(encodeURIComponent(category))),

  getTopSharingSkills: () =>
    apiFetch<TrendingSkillDto[]>(API_ROUTES.TRENDING_SKILLS),

  getTopMentors: () =>
    apiFetch<UserPublicDto[]>(API_ROUTES.TRENDING_MENTORS),
};
