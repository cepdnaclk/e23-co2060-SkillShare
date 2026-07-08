import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Sparkles, Zap, Users, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { Link, useLocation, useNavigate } from "react-router-dom";

/* ─── Spring preset ───────────────────────────────────────── */
const spring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 };

/* ─── Validation ──────────────────────────────────────────── */
const STRICT_EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
const DISPOSABLE_DOMAINS = [
  "mailinator.com","10minutemail.com","tempmail.com",
  "guerrillamail.com","yopmail.com","dropmail.me",
];

const validateEmail = (email: string): string | null => {
  if (!email.trim()) return "Email cannot be empty.";
  if (!STRICT_EMAIL_REGEX.test(email)) return "Invalid email format. Please enter a real email address.";
  const domain = email.split("@")[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) return "Temporary email addresses are not allowed.";
  return null;
};

/* ─── Ambient glass orbs (standalone page version) ──────── */
const SignUpOrbs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
    <div
      className="absolute -top-[25%] -left-[15%] w-[650px] h-[650px] rounded-full animate-drift-slow"
      style={{ background: "radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)", filter: "blur(90px)" }}
    />
    <div
      className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full animate-drift-medium"
      style={{ background: "radial-gradient(circle, rgba(192,38,211,0.22) 0%, transparent 70%)", filter: "blur(100px)" }}
    />
    <div
      className="absolute top-[30%] right-[10%] w-[350px] h-[350px] rounded-full animate-drift-fast"
      style={{ background: "radial-gradient(circle, rgba(251,146,60,0.16) 0%, transparent 70%)", filter: "blur(110px)" }}
    />
  </div>
);

/* ─── SignUp / Login page ────────────────────────────────── */
const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = location.state?.tab === "signin";
  const { login, register, isLoading, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [emailError, setEmailError] = useState<string | null>(null);

  const passwordMismatch = !isLogin && form.confirmPassword !== "" && form.password !== form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      const validationMessage = validateEmail(form.email);
      if (validationMessage) { setEmailError(validationMessage); return; }
    }
    if (!isLogin && form.password !== form.confirmPassword) return;
    clearError();
    try {
      if (isLogin) {
        await login(form.email, form.password);
        navigate("/dashboard");
      } else {
        await register(form.name, form.email, form.password);
        navigate("/create-profile");
      }
    } catch (err) {
      console.error("SIGN IN / SIGN UP FAILED:", err);
    }
  };

  const features = [
    { icon: Zap,      text: "Skill-based matching algorithm" },
    { icon: Users,    text: "P2P session booking with credits" },
    { icon: Sparkles, text: "Reputation system & feedback tags" },
  ];

  /* ── Shared glass input className ──────────────────────── */
  const inputCls = `
    pl-10 bg-black/30 border border-white/10
    focus:border-white/30 focus-visible:ring-0 focus-visible:outline-none
    backdrop-blur-sm rounded-xl text-white placeholder:text-white/30
    h-11 transition-colors
  `;

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex relative overflow-hidden">
      <SignUpOrbs />

      {/* ── Left: Form Panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-white/90">
              Skill<span className="gradient-text">Share</span>
            </span>
          </Link>

          {/* Tab switcher */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mb-8 gap-1">
            {["Sign Up", "Sign In"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(i === 1); clearError(); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  (i === 1) === isLogin
                    ? "bg-white/15 text-white border border-white/20 shadow-sm backdrop-blur-sm"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 16 : -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white mb-1">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-white/45 text-sm">
                  {isLogin
                    ? "Sign in to continue your learning journey"
                    : "Join thousands of students sharing skills"}
                </p>
              </div>

              <ErrorBanner error={error} onDismiss={clearError} className="mb-5" />

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-white/60 text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        id="name"
                        placeholder="Alex Johnson"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@university.edu"
                      value={form.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({ ...form, email: value });
                        if (!isLogin) setEmailError(validateEmail(value));
                        else setEmailError(null);
                      }}
                      className={`${inputCls} ${emailError ? "border-red-500/50 focus:border-red-400" : ""}`}
                      required
                    />
                  </div>
                  {emailError && !isLogin && (
                    <p className="text-xs text-red-400 mt-1">{emailError}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-white/60 text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? "Enter your password" : "Min. 8 characters"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`${inputCls} pr-10`}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-white/60 text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className={`${inputCls} pr-10 ${passwordMismatch ? "border-red-500/50" : ""}`}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                    )}
                  </div>
                )}

                {/* Submit button — gradient CTA for primary action */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  disabled={isLoading || passwordMismatch || (!isLogin && !!emailError)}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500
                    hover:from-violet-400 hover:to-fuchsia-400 text-white font-semibold text-sm
                    shadow-lg shadow-violet-500/30 transition-all duration-200 flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isLogin ? "Signing in…" : "Creating account…"}
                    </span>
                  ) : (
                    <>{isLogin ? "Sign In" : "Get Started"} <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0A0A0C] px-3 text-white/30">or continue with</span>
                </div>
              </div>

              {/* GitHub OAuth Button — uses window.location.href for a full-page
                  browser redirect, which Spring Security OAuth2 requires.
                  Do NOT use <a href>, <Link>, or fetch — they won't work. */}
              <motion.button
                type="button"
                onClick={() => { window.location.href = "http://localhost:8080/oauth2/authorization/github"; }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="flex items-center justify-center gap-3 w-full h-11 rounded-xl
                  bg-white/5 hover:bg-white/10 backdrop-blur-sm
                  border border-white/10 hover:border-white/20
                  text-white/80 hover:text-white text-sm font-semibold
                  transition-all duration-200 shadow-lg shadow-black/20"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub
              </motion.button>

              <p className="mt-5 text-center text-sm text-white/40">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setIsLogin(!isLogin); clearError(); }}
                  className="text-violet-400 font-medium hover:text-violet-300 transition-colors"
                >
                  {isLogin ? "Sign up free" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Right: Decorative Glass Panel ───────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-12">
        {/* Extra glow for right side */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 via-transparent to-fuchsia-600/6" />
        <div className="absolute inset-0 dot-grid opacity-30" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 0.3 }}
          className="relative z-10 flex flex-col justify-center items-center w-full max-w-sm"
        >
          {/* Glass hero card */}
          <div className="w-full rounded-3xl p-8 mb-8
            bg-white/[0.06] backdrop-blur-2xl border border-white/15
            shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm text-white/90">SkillShare Platform</p>
                <p className="text-xs text-white/40">Peer-to-peer learning</p>
              </div>
            </div>

            {/* Mock skill tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {["React", "Python", "UI/UX", "ML", "Node.js"].map((skill) => (
                <span key={skill} className="px-3 py-1 rounded-full bg-white/8 text-white/70 text-xs font-medium border border-white/12">
                  {skill}
                </span>
              ))}
            </div>

            {/* Mock stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["2.4k", "Mentors"], ["12k", "Sessions"], ["98%", "Rated"]].map(([val, label]) => (
                <div key={label} className="p-2 rounded-xl bg-white/5 border border-white/8">
                  <p className="font-heading font-bold text-sm gradient-text">{val}</p>
                  <p className="text-xs text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Learn. Teach. Grow.</h2>
            <p className="text-white/45 text-sm max-w-xs leading-relaxed">
              The algorithmic skill-sharing platform that matches you with the perfect mentor or student.
            </p>
          </div>

          <div className="space-y-3 w-full">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/50">
                <div className="w-7 h-7 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
