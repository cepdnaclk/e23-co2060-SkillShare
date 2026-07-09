import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { authApi, usersApi, type User, type ApiError } from "@/lib/api";
import {
  getToken, setToken, removeToken,
  getStoredUser, setStoredUser, removeStoredUser,
} from "@/lib/auth";

// ============================================================
// Decode JWT payload to get the user's email (sub claim)
// ============================================================
/**function decodeJwtEmail(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
*/
// ============================================================
// Context Shape
// ============================================================
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithToken: (jwt: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Provider
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [token, setTokenState] = useState<string | null>(getToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /** After receiving a JWT, we need to also hydrate the user object.
   *  Strategy: the JWT sub claim is the user's email. We use the
   *  token to call GET /api/users/{id} — but first we need the id.
   *  Since the backend returns the token but not the user on login/register,
   *  we store the partial info from the token and let pages fetch full profile.
   *  We use a lightweight JWT decode to get the email and store it as a "stub" user.
   */
  /**const hydrateFromToken = useCallback((jwt: string): User | null => {
    const email = decodeJwtEmail(jwt);
    if (!email) return null;
    // Build a stub user from what we know from the token
    const stub: User = {
      id: "", // Will be filled after profile fetch
      fullName: "",
      email,
      credits: 0,
      reputationScore: 0,
      ratingAvg: 0,
      role: "USER",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    return stub;
  }, []);*/

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);
      console.log("AUTH RESPONSE:", response);
      const jwt = response.token;

      /**const user: User = {
        id: response.userId,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
        credits: 0,
        reputationScore: 0,
        ratingAvg: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };*/
      setToken(jwt);
      setTokenState(jwt);
      if (!response.userId) {
        console.error("Missing userId in response:", response);
        throw new Error("userId is missing");
      }

      const fullProfile = await usersApi.getMe();

      // 🔥 THE HYDRATION MERGE: Blend backend profile with auth numbers!
      const completeUser: User = {
        ...fullProfile,
        credits: fullProfile.credits ?? response.credits ?? 0,
        level: fullProfile.level ?? response.level ?? 1,
        xp: fullProfile.xp ?? response.xp ?? 0,
        reputationScore: fullProfile.reputationScore ?? response.reputationScore ?? 0
      };

      setUser(completeUser);
      setStoredUser(completeUser);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Login failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(fullName, email, password);
      console.log("REGISTER AUTH RESPONSE:", response);
      const jwt = response.token;

      setToken(jwt);
      setTokenState(jwt);
      if (!response.userId) {
        throw new Error("userId is missing after registration");
      }

      // Fetch the newly created profile snapshot
      const fullProfile = await usersApi.getMe();

      // 🔥 THE HYDRATION MERGE: Combine profile data with initial auth payload fields
      const completeUser: User = {
        ...fullProfile,
        credits: fullProfile.credits ?? response.credits, // Safe fallback to 100 if both are empty
        level: fullProfile.level ?? response.level,
        xp: fullProfile.xp ?? response.xp,
        reputationScore: fullProfile.reputationScore ?? response.reputationScore
      };

      setUser(completeUser);
      setStoredUser(completeUser);

    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Registration failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Called by OAuth2RedirectHandler after the backend redirects back with ?token=...
   * Stores the JWT, decodes the userId from the payload, fetches the full user
   * profile, and syncs everything into global state — identical to a normal login.
   */
  const loginWithToken = useCallback(async (jwt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Decode the JWT payload (base64url → JSON) to extract the userId claim.
      const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const userId: string | undefined = payload.userId ?? payload.sub;

      if (!userId) {
        throw new Error("Could not determine userId from OAuth2 token.");
      }

      setToken(jwt);
      setTokenState(jwt);

      const fullUser = await usersApi.getMe();
      
      const completeUser: User = {
        ...fullUser,
        // For OAuth2, fullUser (from UserPublicDto) is missing credits, so we read it from the JWT payload
        credits: payload.credits ?? fullUser.credits ?? 0,
      };

      setUser(completeUser);
      setStoredUser(completeUser);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "OAuth2 authentication failed.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (userId: string) => {
    try {
      const freshUser = await usersApi.getMe();
      setUser((prevUser) => {
        if (!prevUser) {
          setStoredUser(freshUser);
          return freshUser;
        }
        const completeUser = {
          ...freshUser,
          // Always pick the new incoming database total first.
          // Only fallback to prevUser if the field is missing from the payload.
          credits: freshUser.credits !== undefined ? freshUser.credits : prevUser.credits,
          level: freshUser.level !== undefined ? freshUser.level : prevUser.level,
          xp: freshUser.xp !== undefined ? freshUser.xp : prevUser.xp,
        };
        setStoredUser(completeUser);
        return completeUser;
      });
    } catch {
      // silent — don't log out on a profile refresh failure
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    removeStoredUser();
    setTokenState(null);
    setUser(null);
  }, []);

  // Hydrate user data in the background on initial load / refresh
  // This ensures that no matter what page the user is on (e.g., MySchedule),
  // they always get the latest credits and XP from the backend without needing
  // to navigate to a page that explicitly calls refreshUser.
  useEffect(() => {
    if (token && user?.id) {
      refreshUser(user.id);
    }
  }, [token, user?.id, refreshUser]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, register, loginWithToken, logout, clearError, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
