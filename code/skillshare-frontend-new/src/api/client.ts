import { getToken, removeToken } from "@/lib/auth"; // Make sure you have a function to remove token/clear state

export interface ApiError {
  message: string;
  status?: number;
  validationErrors?: Record<string, string>;
}

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080/api") as string;
const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
export const API_BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    skipAuth = false
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const finalPath = normalizedPath.startsWith('/api/') ? normalizedPath.substring(4) : normalizedPath;

  try {
    const response = await fetch(`${API_BASE_URL}${finalPath}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      let validationErrors: Record<string, string> | undefined;
      let rawErrorBody: any = null;

      if (isJson) {
        try {
          rawErrorBody = await response.json();
          errorMessage = rawErrorBody?.message ?? rawErrorBody?.error ?? errorMessage;
          if (rawErrorBody?.errors && typeof rawErrorBody.errors === "object") {
            validationErrors = rawErrorBody.errors;
          }
        } catch {
          errorMessage = "An unexpected JSON error occurred.";
        }
      } else {
        const textErr = await response.text().catch(() => null);
        if (textErr) errorMessage = textErr;
      }

      // 🛑 HANDLE ACCOUNT FREEZE & FORCED LOGOUT
      if (response.status === 403) {
        if (rawErrorBody?.error === "ACCOUNT_DISABLED" || errorMessage.includes("disabled")) {
          removeToken(); // Clear token
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/signup?disabled=true"; // Kick user out
          throw { message: "Your account has been disabled by an administrator.", status: 403 } as ApiError;
        }
        // Fallback for standard 403
        errorMessage = errorMessage || "You do not have permission to perform this action.";
      } else if (response.status === 401) {
        errorMessage = "Session expired or unauthorized. Please log in.";
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
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw { message: "Network error. Please check your connection or try again later.", status: 0 } as ApiError;
    }
    throw error;
  }
}

