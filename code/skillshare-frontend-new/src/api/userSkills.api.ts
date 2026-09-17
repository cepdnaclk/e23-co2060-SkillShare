import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { UserSkillDto, UserSkillRequest, UserSearchResponse } from "./types";

export const userSkillsApi = {
  add: (request: UserSkillRequest) =>
    apiFetch<UserSkillDto>(API_ROUTES.USER_SKILLS_ADD, {
      method: "POST",
      body: JSON.stringify(request),
    }),

  remove: (skillId: string, skillType: string) =>
    apiFetch<string>(`${API_ROUTES.USER_SKILLS_REMOVE}?skillId=${encodeURIComponent(skillId)}&skillType=${encodeURIComponent(skillType)}`, {
      method: "DELETE",
    }),

  getByUser: (userId: string) =>
    apiFetch<UserSkillDto[]>(API_ROUTES.userSkillsByUserId(userId)),

  getTeachingByUser: (userId: string) =>
    apiFetch<UserSkillDto[]>(API_ROUTES.teachingSkillsByUserId(userId)),

  getLearningByUser: (userId: string) =>
    apiFetch<UserSkillDto[]>(API_ROUTES.learningSkillsByUserId(userId)),

  searchProfiles: (name: string) =>
    apiFetch<UserSearchResponse[]>(`${API_ROUTES.USER_SKILLS_SEARCH_PROFILES}?name=${encodeURIComponent(name)}`),

  getMentorsBySkill: (skillId: string) =>
    apiFetch<UserSkillDto[]>(API_ROUTES.mentorsBySkillId(skillId)),
};
