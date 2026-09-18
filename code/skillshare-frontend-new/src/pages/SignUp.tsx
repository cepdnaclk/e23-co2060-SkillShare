import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Sparkles, Zap, Users, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { Link, useLocation, useNavigate } from "react-router-dom";

const STRICT_EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
const DISPOSABLE_DOMAINS = ["mailinator.com", "10minutemail.com", "tempmail.com", "guerrillamail.com", "yopmail.com", "dropmail.me"];

const validateEmail = (email: string): string | null => {
  if (!email.trim()) return "Email cannot be empty.";
  if (!STRICT_EMAIL_REGEX.test(email)) return "Invalid email format. Please enter a real email address.";
  const domain = email.split("@")[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) return "Temporary email addresses are not allowed.";
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
    } catch (err) { console.error("SIGN IN / SIGN UP FAILED:", err); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">SkillShare</span>
          </Link>

          <div className="flex p-1 rounded-xl bg-secondary mb-8 gap-1 border border-border/40">
            {["Sign Up", "Sign In"].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 1); clearError(); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${ (i === 1) === isLogin ? "bg-card text-foreground shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground" }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={isLogin ? "login" : "register"} initial={{ opacity: 0, x: isLogin ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? 16 : -16 }}>
              <div className="mb-6">
                <h1 className="text-3xl font-heading font-bold mb-2">{isLogin ? "Welcome back" : "Create your account"}</h1>
                <p className="text-muted-foreground text-sm">{isLogin ? "Glad to see you again!" : "Join thousands of students sharing skills"}</p>
              </div>

              <ErrorBanner error={error} onDismiss={clearError} className="mb-5" />

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Alex Johnson" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-2 h-11 rounded-xl" required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">{isLogin ? "Email" : "University Email"}</Label>
                  <Input id="email" type="email" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`bg-secondary border-2 h-11 rounded-xl ${emailError ? "border-destructive" : ""}`} required />
                  {emailError && !isLogin && <p className="text-xs text-destructive">{emailError}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-secondary border-2 h-11 rounded-xl pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={`bg-secondary border-2 h-11 rounded-xl pr-10 ${passwordMismatch ? "border-destructive" : ""}`} required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordMismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl font-semibold mt-2" disabled={isLoading}>
                  {isLoading ? "Processing..." : (isLogin ? "Log in" : "Sign up")}
                </Button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground font-medium">Or continue with</span></div>
              </div>
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2 font-medium bg-background border-border hover:bg-secondary" onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/github'}>
                <Github className="w-5 h-5" /> GitHub
              </Button>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                {isLogin ? (
                  <p>Don't have an account? <button type="button" onClick={() => { setIsLogin(false); clearError(); }} className="text-primary font-medium hover:underline">Sign up</button></p>
                ) : (
                  <p>Already have an account? <button type="button" onClick={() => { setIsLogin(true); clearError(); }} className="text-primary font-medium hover:underline">Sign in</button></p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-50 via-indigo-100/50 to-indigo-50 dark:from-indigo-950/40 dark:via-background dark:to-indigo-950/20 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="max-w-md w-full relative z-10 flex flex-col items-center text-center">
           <div className="w-16 h-16 bg-white dark:bg-card rounded-2xl shadow-xl flex items-center justify-center mb-8 border border-indigo-100 dark:border-indigo-900/50">
             <Sparkles className="w-8 h-8 text-primary" />
           </div>
           
           <h2 className="text-4xl font-bold mb-4 font-heading text-foreground">
             Learn. Teach. Connect.
           </h2>
           <p className="text-lg text-muted-foreground leading-relaxed mb-12">
             Join thousands of students and mentors on the most intuitive skill-sharing platform.
           </p>

           <div className="w-full bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-2xl p-8 border border-white/40 dark:border-border shadow-lg">
             <p className="font-serif italic text-2xl text-primary/80 mb-4">
               "Better Skills, Brighter Days"
             </p>
             <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
               Our Promise
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;