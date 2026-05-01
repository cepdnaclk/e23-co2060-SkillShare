import type { User } from "./api";

const TOKEN_KEY = "skillshare_token";
const USER_KEY = "skillshare_user";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
};
export const setStoredUser = (user: User): void =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeStoredUser = (): void => localStorage.removeItem(USER_KEY);

export const isAuthenticated = (): boolean => !!getToken();

export const getUserId = (): string | null => getStoredUser()?.id ?? null;

export const clearAuth = (): void => {
  removeToken();
  removeStoredUser();
};
