import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Calendar,
  Zap,
  GraduationCap,
  Sparkles,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { sessionsApi } from "@/api/sessions.api";
import { feedbackApi } from "@/api/feedback.api";
import { userSkillsApi } from "@/api/userSkills.api";
import type { SessionResponse as Session, FeedbackResponse as Feedback, UserSkillDto as UserSkill } from "@/api/types";
import type { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";

/* ─── Helpers ─────────────────────────────────────────────────── */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/* ─── Animation ───────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ─── Sub-components ──────────────────────────────────────────── */

function SessionRow({ session }: { session: Session }) {
  const statusColor: Record<string, string> = {
    PENDING:   "text-amber-700 bg-amber-50 border-amber-200",
    ACCEPTED:  "text-emerald-700 bg-emerald-50 border-emerald-200",
    COMPLETED: "text-muted-foreground bg-secondary border-border",
    CANCELLED: "text-red-700 bg-red-50 border-red-200",
    REJECTED:  "text-red-700 bg-red-50 border-red-200",
    EXPIRED:   "text-muted-foreground bg-secondary border-border",
  };
  const badge =
    statusColor[session.status] ?? "text-muted-foreground bg-secondary border-border";

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
      <div className="min-w-0 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate text-foreground">{session.skillName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
            {formatDate(session.startTime)}
            <span className="text-border">·</span>
            {session.mentorName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`inline-flex items-center h-6 px-2.5 text-[11px] font-semibold rounded-full border ${badge}`}
        >
          {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
        </span>
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: UserSkill }) {
  return (
    <div className="flex flex-col p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-learn-bg flex items-center justify-center mb-4 border border-learn-border">
        <Compass className="w-5 h-5 text-learn-text" aria-hidden />
      </div>
      <h3 className="font-semibold text-foreground truncate mb-1">{skill.skillName}</h3>
      <p className="text-xs text-muted-foreground truncate mb-4">
        {skill.proficiencyLevel
          ? skill.proficiencyLevel.charAt(0) + skill.proficiencyLevel.slice(1).toLowerCase()
          : "Beginner"}
      </p>
      <div className="mt-auto pt-4 border-t border-border/50">
        <button className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
          Find sessions <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [learnerSessions, setLearnerSessions] = useState<Session[]>([]);
  const [mentorSessions, setMentorSessions] = useState<Session[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const uid = user.id;
    if (refreshUser) refreshUser(uid);
    setLoading(true);

    Promise.all([
      sessionsApi.getLearnerSessions(uid).catch(() => [] as Session[]),
      sessionsApi.getMentorSessions(uid).catch(() => [] as Session[]),
      feedbackApi.getForUser(uid).catch(() => [] as Feedback[]),
      userSkillsApi.getByUser(uid).catch(() => [] as UserSkill[]),
    ])
      .then(([ls, ms, fb, sk]) => {
        setLearnerSessions(ls);
        setMentorSessions(ms);
        setFeedback(fb);
        setSkills(sk);
      })
      .catch((err: ApiError) => {
        setError(err.message ?? "Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, [user?.id, refreshUser]);

  /* ── Derived data ─────────────────────────────────────────── */
  const teachSkills = skills.filter((s) => s.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.skillType === "LEARN");
  const upcomingLearner = learnerSessions.filter((s) =>
    ["PENDING", "ACCEPTED"].includes(s.status)
  );
  const upcomingMentor = mentorSessions.filter((s) => s.status === "PENDING");
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-6 md:py-10 pb-20">
        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {greeting()}, {firstName}.
          </h1>
          <p className="text-base text-muted-foreground mt-2">
            Ready to learn something new today?
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-8">
            <div className="h-28 rounded-2xl bg-secondary animate-pulse" />
            <div className="h-64 rounded-card bg-secondary animate-pulse" />
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-10"
          >
            {/* ── 2. SUMMARY CARDS ──────────────────────────────────────── */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Award, label: "Learning Credits", value: String(user?.credits ?? 0), iconBg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
                { icon: Compass, label: "Skills Learning", value: String(learnSkills.length), iconBg: "bg-learn-bg border-learn-border", iconColor: "text-learn-text" },
                { icon: BookOpen, label: "Skills Teaching", value: String(teachSkills.length), iconBg: "bg-teach-bg border-teach-border", iconColor: "text-teach-text" },
                { icon: Calendar, label: "Upcoming Sessions", value: String(upcomingLearner.length), iconBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-card border border-border shadow-sm p-5 flex flex-col items-start hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-full border ${stat.iconBg} flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} aria-hidden />
                  </div>
                  <p className="text-3xl font-semibold text-foreground mb-1 tracking-tight">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── 3. MAIN HERO ─────────────────────────────────────────── */}
            <motion.div variants={fadeUp} className="relative overflow-hidden rounded-card bg-card border border-border shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-learn-bg/50 pointer-events-none" />
              {/* Subtle CSS pattern illustration */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none dot-grid [mask-image:linear-gradient(to_left,white,transparent)]" />
              
              <div className="relative z-10 px-8 py-12 md:py-16 md:px-12 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Discover your next skill</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight tracking-tight mb-4">
                  Learn from someone who knows.
                </h2>
                <p className="text-base text-muted-foreground mb-8 max-w-lg">
                  Explore a community of learners and mentors. Exchange knowledge, earn credits, and grow together with ZenWare.
                </p>
                <Button 
                  size="lg" 
                  className="rounded-xl font-semibold shadow-sm px-8"
                  onClick={() => navigate("/search")}
                >
                  Explore skills
                </Button>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* ── 4. CONTINUE LEARNING ────────────────────────────────── */}
              <motion.div variants={fadeUp} className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Continue Learning</h2>
                  {learnSkills.length > 0 && (
                    <button 
                      onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Manage
                    </button>
                  )}
                </div>

                {learnSkills.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {learnSkills.map((s) => (
                      <SkillCard key={`${s.skillId}-${s.skillType}`} skill={s} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-card border border-border rounded-2xl border-dashed">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <Compass className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">No learning goals yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
                      Add skills you want to learn to get personalized recommendations.
                    </p>
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}>
                      Add a goal
                    </Button>
                  </div>
                )}
              </motion.div>

              {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
              <div className="space-y-8">
                {/* ── 5. UPCOMING SESSIONS ──────────────────────────────── */}
                <motion.div variants={fadeUp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Upcoming Sessions</h2>
                    {upcomingLearner.length > 0 && (
                      <button 
                        onClick={() => navigate("/sessions")}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        View all
                      </button>
                    )}
                  </div>
                  
                  {upcomingLearner.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingLearner.slice(0, 3).map((s) => (
                        <SessionRow key={s.id} session={s} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-card border border-border rounded-2xl">
                      <p className="text-sm text-muted-foreground mb-4">No upcoming sessions.</p>
                      <Button variant="outline" size="sm" className="rounded-lg w-full" onClick={() => navigate("/search")}>
                        Find a mentor
                      </Button>
                    </div>
                  )}
                </motion.div>

                {/* ── 6. TEACH A SKILL CTA ──────────────────────────────── */}
                <motion.div variants={fadeUp} className="bg-teach-bg border border-teach-border rounded-2xl p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-teach-border/50 flex items-center justify-center mb-4">
                      <GraduationCap className="w-5 h-5 text-teach-text" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">Have a skill to share?</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      Help another student learn something useful while earning credits.
                    </p>
                    <Button 
                      className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    >
                      Teach a skill
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;