import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { AvailabilityRequest, AvailabilityResponse } from "./types";

export const availabilityApi = {
  add: (startTime: string, endTime: string) =>
    apiFetch<AvailabilityResponse>(API_ROUTES.AVAILABILITY_ADD, {
      method: "POST",
      body: JSON.stringify({ startTime, endTime } as AvailabilityRequest),
    }),

  getMyAvailabilities: () =>
    apiFetch<AvailabilityResponse[]>(API_ROUTES.AVAILABILITY_MY_SLOTS),

  getMentorSlots: (mentorId: string) =>
    apiFetch<AvailabilityResponse[]>(API_ROUTES.mentorSlotsByMentorId(mentorId)),

  delete: (availabilityId: string) =>
    apiFetch<string>(API_ROUTES.deleteAvailability(availabilityId), {
      method: "DELETE",
    }),
};
