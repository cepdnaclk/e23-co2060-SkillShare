import { getToken } from "@/lib/auth";

/**
 * Normalized API Error structure used throughout the frontend.
 */
export interface ApiError {
  message: string;
  status?: number;
  validationErrors?: Record<string, string>;
}

/**
 * Resolves the API base URL from Vite environment variables.
 * Do not hardcode production URLs here.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080/api") as string;

/**
 * Core fetch wrapper.
 * - Attaches Authorization header automatically for authenticated requests
 * - Parses JSON errors from the backend and throws them as ApiError
 * - Normalizes 401, 403, 404, 409, 500, and Network errors
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  
  // Only inject Content-Type if it's not a FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure path starts with slash if missing
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // IMPORTANT: Backend controllers include /api in their own @RequestMapping (e.g. @RequestMapping("/api/users")).
  // API_BASE_URL is set to "http://localhost:8080/api", and routes.ts constants do NOT include /api.
  // This stripping is a defensive safeguard ONLY for any legacy callers that accidentally pass "/api/..." paths.
  // Normal operation: API_BASE_URL + "/users/me" = "http://localhost:8080/api/users/me" ✅
  const finalPath = normalizedPath.startsWith('/api/') ? normalizedPath.substring(4) : normalizedPath;

  try {
    const response = await fetch(`${API_BASE_URL}${finalPath}`, {
      ...options,
      headers,
    });

    // Handle no-content responses
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      let validationErrors: Record<string, string> | undefined;

      if (isJson) {
        try {
          const errBody = await response.json();
          errorMessage = errBody?.message ?? errBody?.error ?? errorMessage;
          if (errBody?.errors && typeof errBody.errors === "object") {
             validationErrors = errBody.errors;
          }
        } catch {
          errorMessage = "An unexpected JSON error occurred.";
        }
      } else {
        const textErr = await response.text().catch(() => null);
        if (textErr) errorMessage = textErr;
      }

      // Customize specific HTTP status messages to prevent leaking stack traces
      if (response.status === 401) {
         errorMessage = "Session expired or unauthorized. Please log in.";
      } else if (response.status === 403) {
         errorMessage = "You do not have permission to perform this action.";
      } else if (response.status === 500) {
         errorMessage = "An internal server error occurred.";
      }

      const err: ApiError = { message: errorMessage, status: response.status, validationErrors };
      throw err;
    }

    if (isJson) {
      return response.json() as Promise<T>;
    }
    
    return response.text() as unknown as T;
  } catch (error) {
    // Catch fetch/network errors (e.g. server down, cors issue)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw { message: "Network error. Please check your connection or try again later.", status: 0 } as ApiError;
    }
    throw error;
  }
}
