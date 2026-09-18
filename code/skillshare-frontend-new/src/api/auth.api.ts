import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { AuthenticationRequest, RegisterRequest, AuthenticationResponse } from "./types";

export const authApi = {
  login: (request: AuthenticationRequest) =>
    apiFetch<AuthenticationResponse>(API_ROUTES.AUTH_LOGIN, {
      method: "POST",
      body: JSON.stringify(request),
    }, true),

  register: (request: RegisterRequest) =>
    apiFetch<AuthenticationResponse>(API_ROUTES.AUTH_REGISTER, {
      method: "POST",
      body: JSON.stringify(request),
    }, true),
};
