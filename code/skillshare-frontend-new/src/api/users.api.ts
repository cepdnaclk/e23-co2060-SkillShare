import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { UserPrivateDto, UserPublicDto } from "./types";

export const usersApi = {
  getMe: () =>
    apiFetch<UserPrivateDto>(API_ROUTES.USERS_ME),

  getById: (userId: string) =>
    apiFetch<UserPublicDto>(API_ROUTES.userById(userId)),

  updateMyBio: (bio: string) =>
    apiFetch<UserPrivateDto>(API_ROUTES.USERS_UPDATE_BIO, {
      method: "PATCH",
      body: bio != null && bio.trim() !== "" ? bio : " ", // Prevent HttpMessageNotReadable on empty payload
      headers: {
        "Content-Type": "text/plain", // Set to text/plain since it's a raw string
      }
    }),

  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    // Using apiFetch, which handles auth and ignores Content-Type for FormData
    return apiFetch<{ imageUrl: string }>(API_ROUTES.USERS_UPLOAD_PROFILE_PICTURE, {
      method: "POST",
      body: formData,
    });
  }
};
