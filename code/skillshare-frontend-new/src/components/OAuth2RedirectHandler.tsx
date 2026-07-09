import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * OAuth2RedirectHandler
 *
 * Mounted at /oauth2/redirect — the exact path the Spring backend sends the
 * browser to after a successful GitHub OAuth2 login.
 *
 * Flow:
 *  1. Extract ?token=<jwt> from the URL.
 *  2. Call loginWithToken() to store the JWT, decode the userId, fetch the
 *     full user profile, and sync global auth state (same as a normal login).
 *  3. Navigate to /dashboard, replacing this transient URL in history so the
 *     user cannot "Back" into the redirect page.
 *  4. On any error, send the user to /signup?error=OAuth2_Authentication_Failed.
 */
const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  // Guard against React Strict Mode double-invocation in development
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get("token");
    const needsProfileCompletion = searchParams.get("needsProfileCompletion") === "true";

    if (!token) {
      navigate("/signup?error=OAuth2_Authentication_Failed", { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => {
        if (needsProfileCompletion) {
          navigate("/create-profile", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {
        navigate("/signup?error=OAuth2_Authentication_Failed", { replace: true });
      });
  }, [searchParams, navigate, loginWithToken]);

  // ── Brief loading screen shown while the async work completes ──────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        color: "#e2e8f0",
        fontFamily: "'Inter', sans-serif",
        gap: "1.5rem",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "4px solid rgba(139, 92, 246, 0.2)",
          borderTopColor: "#8b5cf6",
          animation: "spin 0.9s linear infinite",
        }}
      />

      {/* Keyframes injected via a style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#c4b5fd" }}>
          Authenticating with GitHub…
        </h2>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.95rem", color: "#94a3b8" }}>
          Hang tight — we're logging you in securely.
        </p>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;
