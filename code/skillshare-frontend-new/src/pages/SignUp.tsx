import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Sparkles, Zap, Users, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
//import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { Link, useLocation, useNavigate } from "react-router-dom";

const STRICT_EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;

const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "yopmail.com",
  "dropmail.me",
];

const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Email cannot be empty.";
  }

  if (!STRICT_EMAIL_REGEX.test(email)) {
    return "Invalid email format. Please enter a real email address.";
  }

  const domain = email.split("@")[1]?.toLowerCase();

  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return "Temporary email addresses are not allowed.";
  }

  return null;
};

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

      if (validationMessage) {
        setEmailError(validationMessage);
        return;
      }
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
    { icon: Zap, text: "Skill-based matching algorithm" },
    { icon: Users, text: "P2P session booking with credits" },
    { icon: Sparkles, text: "Reputation system & feedback tags" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left: Form Panel ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">
              Skill<span className="gradient-text">Share</span>
            </span>
          </Link>

          {/* Tab switcher */}
          <div className="flex p-1 rounded-xl bg-secondary mb-8 gap-1">
            {["Sign Up", "Sign In"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(i === 1); clearError(); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  (i === 1) === isLogin
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold mb-1">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isLogin
                    ? "Sign in to continue your learning journey"
                    : "Join thousands of students sharing skills"}
                </p>
              </div>

              <ErrorBanner error={error} onDismiss={clearError} className="mb-5" />

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Alex Johnson"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="pl-10 bg-secondary border-border focus:border-primary/50 h-11"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@university.edu"
                      value={form.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({ ...form, email: value });

                        if (!isLogin) {
                          setEmailError(validateEmail(value));
                        } else {
                          setEmailError(null);
                        }
                      }}
                      className={`pl-10 bg-secondary border-border h-11 ${
                          emailError ? "border-destructive focus:border-destructive" : "focus:border-primary/50"
                      }`}
                      required
                    />
                  </div>
                </div>

                {emailError && !isLogin && (
                    <p className="text-xs text-destructive mt-1">{emailError}</p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? "Enter your password" : "Min. 8 characters"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="pl-10 pr-10 bg-secondary border-border focus:border-primary/50 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password – sign-up only */}
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className={`pl-10 pr-10 bg-secondary border-border h-11 ${
                          passwordMismatch ? "border-destructive focus:border-destructive" : "focus:border-primary/50"
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs text-destructive mt-1">Passwords do not match.</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-200"
                  disabled={isLoading || passwordMismatch || (!isLogin && !!emailError)}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {isLogin ? "Signing in…" : "Creating account…"}
                    </span>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Get Started"} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* GitHub OAuth Button */}
              <a
                href="http://localhost:8080/oauth2/authorization/github"
                className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border-2 border-border bg-[#161b22] hover:bg-[#21262d] text-white text-sm font-semibold transition-all duration-200 hover:border-border/80 hover:shadow-lg"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub
              </a>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setIsLogin(!isLogin); clearError(); }}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Sign up free" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Right: Decorative Panel ──────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10" />
        <div className="absolute inset-0 dot-grid" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 flex flex-col justify-center items-center p-16 w-full"
        >
          {/* Hero card */}
          <div className="glass-card rounded-3xl p-8 w-full max-w-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">SkillShare Platform</p>
                <p className="text-xs text-muted-foreground">Peer-to-peer learning</p>
              </div>
            </div>

            {/* Mock skill tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {["React", "Python", "UI/UX", "ML", "Node.js"].map((skill) => (
                <span key={skill} className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20">
                  {skill}
                </span>
              ))}
            </div>

            {/* Mock stat */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["2.4k", "Mentors"], ["12k", "Sessions"], ["98%", "Rated"]].map(([val, label]) => (
                <div key={label} className="p-2 rounded-xl bg-secondary/50">
                  <p className="font-heading font-bold text-sm gradient-text">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold mb-3">
              Learn. Teach. Grow.
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              The algorithmic skill-sharing platform that matches you with the perfect mentor or student.
            </p>
          </div>

          <div className="mt-8 space-y-3 w-full max-w-sm">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
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
