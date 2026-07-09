import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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

      const fullProfile = await usersApi.getById(response.userId);

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
      const fullProfile = await usersApi.getById(response.userId);

      // 🔥 THE HYDRATION MERGE: Combine profile data with initial auth payload fields
      const completeUser: User = {
        ...fullProfile,
        credits: fullProfile.credits ?? response.credits ?? 100, // Safe fallback to 100 if both are empty
        level: fullProfile.level ?? response.level ?? 1,
        xp: fullProfile.xp ?? response.xp ?? 0,
        reputationScore: fullProfile.reputationScore ?? response.reputationScore ?? 0
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

      const fullUser = await usersApi.getById(userId);
      setUser(fullUser);
      setStoredUser(fullUser);
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
      const freshUser = await usersApi.getById(userId);
      //  FIX: Use functional state update to preserve existing gamified scores
      setUser((prevUser) => {
        if (!prevUser) return freshUser;
        const completeUser: User = {
          ...freshUser,
          id: freshUser.id ?? prevUser.id, // Ensure ID isn't lost if backend uses different naming
          credits: freshUser.credits ?? prevUser.credits ?? 0, // 🌟 Preserves your credits!
          level: freshUser.level ?? prevUser.level ?? 1,
          xp: freshUser.xp ?? prevUser.xp ?? 0,
        };
        setStoredUser(completeUser); // Persist the fully hydrated user back to localStorage
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
