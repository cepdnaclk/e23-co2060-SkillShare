import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  sessionsApi,
  feedbackApi,
  userSkillsApi,
  type Session,
  type Feedback,
  type UserSkill,
  type ApiError,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";

/* ─── Helpers ─────────────────────────────────────────────────── */
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

/* ─── Animation ───────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* ─── Sub-components ──────────────────────────────────────────── */

function SkillPill({ name, variant }: { name: string; variant: "teach" | "learn" }) {
  const cls = variant === "teach" ? "skill-badge-teach" : "skill-badge-learn";
  return (
    <span className={`${cls} inline-flex items-center h-7 px-3 text-sm font-medium rounded-full transition-colors`}>
      {name}
    </span>
  );
}

function SessionRow({ session }: { session: Session }) {
  const statusColor: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-500/10",
    ACCEPTED: "text-primary bg-primary/10",
    COMPLETED: "text-muted-foreground bg-secondary",
    CANCELLED: "text-red-600 bg-red-500/10",
    REJECTED: "text-red-600 bg-red-500/10",
    EXPIRED: "text-muted-foreground bg-secondary",
  };
  const badge = statusColor[session.status] ?? "text-muted-foreground bg-secondary";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border/40 last:border-0 group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 truncate mb-2 sm:mb-0">
        <span className="text-base font-medium text-foreground">{session.skillName}</span>
        <span className="text-sm text-muted-foreground">with {session.mentorName}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">{formatDate(session.startTime)}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${badge}`}>
          {session.status}
        </span>
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
  const upcomingLearner = learnerSessions.filter((s) => ["PENDING", "ACCEPTED"].includes(s.status));
  const upcomingMentor = mentorSessions.filter((s) => s.status === "PENDING");
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-8" />

        {/* ── 1. GREETING ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-14">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {greeting()}, {firstName}
          </h1>
        </motion.div>

        {loading ? (
          <div className="animate-pulse space-y-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="h-24 bg-secondary/50 rounded-xl" />
              <div className="h-24 bg-secondary/50 rounded-xl" />
            </div>
            <div className="h-32 bg-secondary/50 rounded-xl" />
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-16">
            
            {/* ── 2. TEACH ↔ LEARN ──────────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
              
              {/* I CAN TEACH */}
              <motion.div variants={fadeUp} className="group">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    I Can Teach
                  </h2>
                  <button
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Manage →
                  </button>
                </div>

                {teachSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {teachSkills.map((s) => (
                      <SkillPill key={`${s.skillId}-${s.skillType}`} name={s.skillName ?? "Unnamed"} variant="teach" />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    No skills yet <span className="mx-1 text-border">·</span> Add a skill →
                  </button>
                )}
              </motion.div>

              {/* I WANT TO LEARN */}
              <motion.div variants={fadeUp} className="group">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    I Want To Learn
                  </h2>
                  <button
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Manage →
                  </button>
                </div>

                {learnSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {learnSkills.map((s) => (
                      <SkillPill key={`${s.skillId}-${s.skillType}`} name={s.skillName ?? "Unnamed"} variant="learn" />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    No goals yet <span className="mx-1 text-border">·</span> Add a goal →
                  </button>
                )}
              </motion.div>
            </div>

            {/* ── 3. UPCOMING ───────────────────────────────────────── */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
                  Upcoming
                </h2>
                {(upcomingLearner.length > 0 || upcomingMentor.length > 0) && (
                  <button
                    onClick={() => navigate("/sessions")}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    View all sessions →
                  </button>
                )}
              </div>

              {upcomingLearner.length > 0 ? (
                <div className="flex flex-col">
                  {upcomingLearner.slice(0, 4).map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2 border-b border-border/40">
                  No upcoming sessions.
                </p>
              )}
            </motion.div>

            {/* ── 4. SECONDARY STATS ────────────────────────────────── */}
            {user && (
              <motion.div variants={fadeUp} className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  
                  <button onClick={() => navigate("/sessions")} className="text-left group">
                    <p className="text-2xl font-light text-foreground group-hover:text-primary transition-colors">{upcomingLearner.length}</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1.5">Booked</p>
                  </button>
                  
                  <button onClick={() => navigate("/sessions")} className="text-left group relative">
                    <p className="text-2xl font-light text-foreground group-hover:text-primary transition-colors">
                      {upcomingMentor.length}
                      {upcomingMentor.length > 0 && <span className="absolute top-1 ml-1 w-1.5 h-1.5 rounded-full bg-primary" />}
                    </p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1.5">Pending</p>
                  </button>

                  <button onClick={() => navigate("/create-profile", { state: { startStep: 2 } })} className="text-left group">
                    <p className="text-2xl font-light text-foreground group-hover:text-primary transition-colors">{teachSkills.length}</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1.5">Skills</p>
                  </button>

                  <button onClick={() => navigate("/notifications")} className="text-left group">
                    <p className="text-2xl font-light text-foreground group-hover:text-primary transition-colors">{feedback.length}</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1.5">Feedback</p>
                  </button>

                  <div className="text-left">
                    <p className="text-2xl font-light text-foreground">{user.credits ?? 0}</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1.5">Credits</p>
                  </div>

                  <div className="text-left">
                    <p className="text-2xl font-light text-foreground">{user.reputationScore ?? 0}</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1.5">Rep</p>
                  </div>

                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;