import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "./client";
import { setToken } from "@/lib/auth";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  // 1. Successful JSON request
  it("should return parsed JSON response on a successful request", async () => {
    const responsePayload = { id: "u-123", name: "Alice" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch<typeof responsePayload>("/users/me");

    expect(result).toEqual(responsePayload);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // 2. JWT Authorization header
  it("should include Bearer token in Authorization header and Content-Type: application/json", async () => {
    const token = "mock-jwt-token-abc";
    setToken(token);

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/dashboard");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get("Authorization")).toBe(`Bearer ${token}`);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  // 3. skipAuth behavior
  it("should not include Authorization header when skipAuth is true and still succeed", async () => {
    const token = "mock-jwt-token-abc";
    setToken(token);

    const responsePayload = { skills: ["React", "TypeScript"] };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch<typeof responsePayload>("/skills", {}, true);

    expect(result).toEqual(responsePayload);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  // 4. 401 handling
  it("should reject with status 401 and session expired message on 401 response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/protected")).rejects.toMatchObject({
      status: 401,
      message: "Session expired or unauthorized. Please log in.",
    });
  });

  // 5. 403 handling
  it("should reject with status 403 and forbidden message on normal 403 response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/admin/dashboard")).rejects.toMatchObject({
      status: 403,
      message: "You do not have permission to perform this action.",
    });
  });

  // 6. 409 handling
  it("should preserve status 409 and the backend message in ApiError", async () => {
    const backendMessage = "Email already registered";
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: backendMessage }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/auth/register")).rejects.toMatchObject({
      status: 409,
      message: backendMessage,
    });
  });

  // 7. Validation error handling
  it("should include message, status 400, and validationErrors in ApiError on 400 validation response", async () => {
    const validationErrors = { fieldName: "validation message" };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: validationErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/sessions")).rejects.toMatchObject({
      status: 400,
      message: "Validation failed",
      validationErrors,
    });
  });

  // 8. 204 No Content
  it("should resolve to undefined on a 204 No Content response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch("/notifications/read-all");

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // 9. Network failure
  it("should reject with network error message and status 0 when fetch throws TypeError('Failed to fetch')", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/users/profile")).rejects.toMatchObject({
      status: 0,
      message: "Network error. Please check your connection or try again later.",
    });
  });
});
