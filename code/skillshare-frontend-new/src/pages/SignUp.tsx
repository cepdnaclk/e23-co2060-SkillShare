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
        // On successful signup, navigate to create-profile with the special signup flag
        sessionStorage.setItem("skillshare-welcome", "true"); navigate("/create-profile");
      }
    } catch (err) { console.error("SIGN IN / SIGN UP FAILED:", err); }
  };

  return (
    <div className="h-[100dvh] w-full bg-background flex overflow-hidden">
      
      {/* LEFT SIDE: Visuals (Fixed) */}
      <div className="hidden lg:flex flex-1 relative bg-secondary/30 border-r border-border overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <div className="flex-1 flex flex-col justify-center p-12 lg:p-20 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-16 hover:opacity-80 transition-opacity w-fit">
            <img src="/skillshare.png" alt="SkillShare Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl tracking-tight text-foreground">SkillShare</span>
          </Link>

          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-md"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground tracking-tight leading-tight">
              Learn. Teach.<br/>
              <span className="text-primary">Grow.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              Join thousands of students and mentors on the most intuitive skill-sharing platform.
            </p>

            <div className="space-y-6">
              {[
                { icon: Zap, title: "Fast connections", desc: "Find the right mentor in seconds." },
                { icon: Users, title: "Peer community", desc: "Learn from people who understand." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-background/50 border border-transparent hover:border-border/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE: Form (Scrollable) */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 min-h-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.4 }} 
            className="w-full max-w-md relative z-10"
          >
            {/* Mobile Header (only visible on mobile since desktop has the left side) */}
            <div className="lg:hidden mb-10 text-center">
              <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/skillshare.png" alt="SkillShare Logo" className="w-8 h-8 object-contain" />
                <span className="font-bold text-xl tracking-tight text-foreground">SkillShare</span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button type="button" onClick={() => { setIsLogin(!isLogin); clearError(); setEmailError(null); }} className="text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>

            <ErrorBanner error={error} onDismiss={clearError} className="mb-6" />

            <AnimatePresence mode="wait">
              <motion.form 
                key={isLogin ? "login" : "signup"} 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }} 
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                {!isLogin && (
                  <div className="space-y-2 group">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pl-10 h-11 rounded-xl bg-secondary/30 transition-colors focus:bg-background" required />
                    </div>
                  </div>
                )}
                <div className="space-y-2 group">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(null); }} className={`pl-10 h-11 rounded-xl transition-colors focus:bg-background ${emailError ? 'border-red-500 bg-red-500/5' : 'bg-secondary/30'}`} required />
                  </div>
                  {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 rounded-xl bg-secondary/30 transition-colors focus:bg-background" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {!isLogin && (
                  <div className="space-y-2 group">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={`pl-10 pr-10 h-11 rounded-xl transition-colors focus:bg-background ${passwordMismatch ? 'border-red-500 bg-red-500/5' : 'bg-secondary/30'}`} required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                  </div>
                )}
                
                <Button type="submit" disabled={isLoading || passwordMismatch} className="w-full h-11 rounded-xl mt-6 group transition-transform active:scale-[0.98]">
                  {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                
                <Button type="button" variant="outline" className="w-full h-11 rounded-xl gap-2 font-medium hover:bg-secondary/80 transition-colors" onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/github'}>
                  <Github className="w-4 h-4" /> GitHub
                </Button>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
