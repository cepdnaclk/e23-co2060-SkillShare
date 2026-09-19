import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  sessionsApi,
  feedbackApi,
  userSkillsApi,
  type Session,
  type Feedback,
  type UserSkill,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { 
  Calendar, BookOpen, GraduationCap, Clock, Inbox, PlayCircle, Trophy, Sparkles, Plus, Search, ChevronRight, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkillPickerModal } from "@/components/SkillPickerModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* Helpers */
const formatDate = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/* Sub-components */
function SkillPill({ name, variant }: { name: string; variant: "teach" | "learn" }) {
  const isTeach = variant === "teach";
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-default ${isTeach ? 'bg-primary/10 text-primary border-primary/20' : 'bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20'}`}
    >
      {isTeach ? <GraduationCap className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
      {name}
    </motion.div>
  );
}

function SessionRow({ session, onClick }: { session: Session; onClick: () => void }) {
  const dateStr = formatDate(session.startTime);
  const isPending = session.status === "PENDING";
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="group flex items-center gap-4 py-3 cursor-pointer hover:bg-secondary/50 px-3 -mx-3 rounded-xl transition-colors border-b border-border/50 last:border-0"
    >
      <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <PlayCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {session.skillName} <span className="text-muted-foreground font-normal mx-1">with</span> {session.learnerName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {dateStr}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {isPending && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Pending
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, onClick }: { label: string; value: string | number; icon: React.ElementType; onClick?: () => void }) {
  return (
    <motion.div whileHover={onClick ? { y: -2 } : {}}>
      <Card className={`bg-card shadow-sm border-border/60 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`} onClick={onClick}>
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-wider uppercase">{label}</span>
            <Icon className="w-4 h-4 opacity-50" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [upcomingLearner, setUpcomingLearner] = useState<Session[]>([]);
  const [upcomingMentor, setUpcomingMentor] = useState<Session[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  
  // Post-Signup Welcome
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Skill Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"TEACH" | "LEARN">("TEACH");

  useEffect(() => {
    // Check if we just signed up
    if (sessionStorage.getItem("skillshare-welcome") === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("skillshare-welcome");
    }
    // Also support location state from CreateProfile if they navigated that way
    if (location.state?.isNewSignup) {
      setShowWelcome(true);
      // clear the state so it doesn't reappear on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    
    const loadAll = async () => {
      try {
        const [mentoring, learning, fbs, skillsRes] = await Promise.all([
          sessionsApi.getMyMentoring(),
          sessionsApi.getMyLearning(),
          feedbackApi.getMyFeedback(),
          userSkillsApi.getByUser(user.id),
        ]);
        
        if (!isMounted) return;
        
        const now = new Date();
        const activeMentoring = mentoring
          .filter(s => (s.status === "SCHEDULED" || s.status === "PENDING") && new Date(s.startTime) >= now)
          .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          
        const activeLearning = learning
          .filter(s => (s.status === "SCHEDULED" || s.status === "PENDING") && new Date(s.startTime) >= now)
          .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setUpcomingMentor(activeMentoring);
        setUpcomingLearner(activeLearning);
        setFeedback(fbs);
        setUserSkills(skillsRes);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError((err as Error).message || "Failed to load dashboard data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();
    
    return () => { isMounted = false; };
  }, [user]);

  const handleAddSkill = async (name: string, type: "TEACH" | "LEARN") => {
    await userSkillsApi.add(name, type);
    // Optimistic / Local update for snappy UI
    if (user) {
      const updated = await userSkillsApi.getByUser(user.id);
      setUserSkills(updated);
    }
    toast.success("Skill added!");
  };

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const teachSkills = userSkills.filter(s => s.skillType === "TEACH");
  const learnSkills = userSkills.filter(s => s.skillType === "LEARN");

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-md flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Welcome to SkillShare</h1>
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
            Everyone has something to teach.<br />Everyone has something to learn.
          </p>
          <Button 
            onClick={() => setShowWelcome(false)} 
            size="lg" 
            className="rounded-full px-8 h-12 text-base font-medium group"
          >
            Get started
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <AppLayout>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]"
      >
        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* 1. HEADER & QUICK ACTIONS */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {greeting()}, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1">Here is what is happening today.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/search")} variant="default" className="gap-2 shadow-sm transition-transform active:scale-95">
              <Search className="w-4 h-4" /> Explore Skills
            </Button>
            <Button onClick={() => navigate("/my-schedule")} variant="outline" className="gap-2 bg-background hover:bg-secondary transition-transform active:scale-95">
              <Calendar className="w-4 h-4" /> My Schedule
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-12">
            <div className="h-40 bg-secondary/50 rounded-xl" />
            <div className="h-40 bg-secondary/50 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* TEACH & LEARN SKILLS */}
            <div className="grid md:grid-cols-2 gap-8">
              
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className="bg-card border-border/60 shadow-sm flex flex-col h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                          I Can Teach
                        </h2>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setPickerType("TEACH"); setPickerOpen(true); }} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>

                    {teachSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {teachSkills.map((s) => (
                          <SkillPill key={`${s.skillId}-teach`} name={s.skillName ?? "Unnamed"} variant="teach" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6 bg-secondary/20 rounded-lg border border-dashed border-border mt-auto h-full">
                        <GraduationCap className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No teaching skills listed.</p>
                        <Button variant="outline" size="sm" onClick={() => { setPickerType("TEACH"); setPickerOpen(true); }} className="h-8 text-xs gap-1 transition-transform active:scale-95">
                          <Plus className="w-3 h-3" /> Add Skills
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className="bg-card border-border/60 shadow-sm flex flex-col h-full hover:border-[hsl(var(--chart-4))]/30 transition-colors">
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[hsl(var(--chart-4))]" />
                        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                          I Want To Learn
                        </h2>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setPickerType("LEARN"); setPickerOpen(true); }} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>

                    {learnSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {learnSkills.map((s) => (
                          <SkillPill key={`${s.skillId}-learn`} name={s.skillName ?? "Unnamed"} variant="learn" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6 bg-secondary/20 rounded-lg border border-dashed border-border mt-auto h-full">
                        <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No learning goals listed.</p>
                        <Button variant="outline" size="sm" onClick={() => { setPickerType("LEARN"); setPickerOpen(true); }} className="h-8 text-xs gap-1 transition-transform active:scale-95">
                          <Plus className="w-3 h-3" /> Add Goals
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* UPCOMING SESSIONS */}
            <Card className="bg-card border-border/60 shadow-sm hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                      Upcoming Sessions
                    </h2>
                  </div>
                  {(upcomingLearner.length > 0 || upcomingMentor.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                      View all
                    </Button>
                  )}
                </div>

                {upcomingLearner.length > 0 ? (
                  <div className="flex flex-col">
                    {upcomingLearner.slice(0, 4).map((s) => (
                      <SessionRow key={s.id} session={s} onClick={() => navigate("/sessions")} />
                    ))}
                  </div>
                ) : upcomingMentor.length > 0 ? (
                  <div className="flex flex-col">
                    {upcomingMentor.slice(0, 4).map((s) => (
                      <SessionRow key={s.id} session={s} onClick={() => navigate("/sessions")} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 bg-secondary/20 rounded-lg border border-dashed border-border">
                    <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">No upcoming sessions right now.</p>
                    <Button onClick={() => navigate("/search")} variant="default" size="sm" className="gap-2 transition-transform active:scale-95">
                      <Search className="w-3.5 h-3.5" /> Find a Mentor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STAT CARDS (MOVED TO BOTTOM) */}
            {user && (
              <div className="pt-6 border-t border-border/40 mt-8">
                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-4">Overview</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    label="Credits" 
                    value={user.credits ?? 0} 
                    icon={Sparkles} 
                  />
                  <StatCard 
                    label="Reputation" 
                    value={user.reputationScore ?? 0} 
                    icon={Trophy} 
                  />
                  <StatCard 
                    label="Upcoming" 
                    value={upcomingLearner.length + upcomingMentor.length} 
                    icon={Calendar} 
                    onClick={() => navigate("/sessions")}
                  />
                  <StatCard 
                    label="Feedback" 
                    value={feedback.length} 
                    icon={Inbox} 
                    onClick={() => navigate("/notifications")}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </motion.div>
      
      {/* Skill Picker Modal */}
      <SkillPickerModal 
        open={pickerOpen} 
        onOpenChange={setPickerOpen} 
        type={pickerType} 
        onAdd={handleAddSkill}
        existingTeach={teachSkills.map(s => s.skillName)}
        existingLearn={learnSkills.map(s => s.skillName)}
      />
    </AppLayout>
  );
};

export default Dashboard;
