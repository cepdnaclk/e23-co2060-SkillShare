import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type {
  AvailabilityRequest,
  AvailabilityResponse,
} from "./types";

export const availabilityApi = {
  /*
   * Create a new mentor availability slot.
   */
  add: (startTime: string, endTime: string) =>
    apiFetch<AvailabilityResponse>(
      API_ROUTES.AVAILABILITY_ADD,
      {
        method: "POST",
        body: JSON.stringify({
          startTime,
          endTime,
        } as AvailabilityRequest),
      }
    ),

  /*
   * Get the authenticated mentor's own availability.
   *
   * This includes booked slots because the owner needs to see
   * which slots are occupied.
   */
  getMyAvailabilities: () =>
    apiFetch<AvailabilityResponse[]>(
      API_ROUTES.AVAILABILITY_MY_SLOTS
    ),

  /*
   * Kept for compatibility with existing components.
   */
  getMySlots: () =>
    apiFetch<AvailabilityResponse[]>(
      API_ROUTES.AVAILABILITY_MY_SLOTS
    ),

  /*
   * Get slots belonging to a mentor.
   *
   * IMPORTANT:
   *
   * This now returns:
   *
   * - free slots
   * - active group-session slots
   *
   * Individual-booked slots are hidden by the backend.
   */
  getMentorSlots: (mentorId: string) =>
    apiFetch<AvailabilityResponse[]>(
      API_ROUTES.mentorSlotsByMentorId(mentorId)
    ),

  /*
   * Delete an availability slot.
   */
  delete: (availabilityId: string) =>
    apiFetch<string>(
      API_ROUTES.deleteAvailability(availabilityId),
      {
        method: "DELETE",
      }
    ),
};