import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { FeedbackRequest, FeedbackResponse, FeedbackTagDto } from "./types";

export const feedbackApi = {
  leave: (sessionId: string, selectedTags: string[]) =>
    apiFetch<FeedbackResponse>(API_ROUTES.FEEDBACK_LEAVE, {
      method: "POST",
      body: JSON.stringify({ sessionId, selectedTags } as FeedbackRequest),
    }),

  getForUser: (userId: string) =>
    apiFetch<FeedbackResponse[]>(API_ROUTES.feedbackByUserId(userId)),

  getTags: () =>
    apiFetch<FeedbackTagDto[]>(API_ROUTES.FEEDBACK_TAGS),
};
