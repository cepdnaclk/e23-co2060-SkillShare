import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Layers,
  Search,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SkeletonStats } from "@/components/SkeletonCard";
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
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* ─── Sub-components ──────────────────────────────────────────── */

function SectionLabel({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: "teach" | "learn" | "neutral";
}) {
  const styles = {
    teach: {
      text: "hsl(var(--teach-text))",
      bg: "hsl(var(--teach-bg))",
      border: "hsl(var(--teach-border))",
    },
    learn: {
      text: "hsl(var(--learn-text))",
      bg: "hsl(var(--learn-bg))",
      border: "hsl(var(--learn-border))",
    },
    neutral: { text: undefined, bg: undefined, border: undefined },
  }[color];

  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={
          styles.bg
            ? { background: styles.bg, border: `1px solid ${styles.border}` }
            : { background: "hsl(var(--secondary))" }
        }
      >
        <Icon
          className="w-3 h-3"
          aria-hidden
          style={styles.text ? { color: styles.text } : undefined}
        />
      </div>
      <p
        className="text-[11px] font-semibold tracking-[0.1em] uppercase"
        style={
          styles.text
            ? { color: styles.text }
            : { color: "hsl(var(--muted-foreground))" }
        }
      >
        {label}
      </p>
    </div>
  );
}

function SkillPill({
  name,
  variant,
}: {
  name: string;
  variant: "teach" | "learn";
}) {
  const cls = variant === "teach" ? "skill-badge-teach" : "skill-badge-learn";
  return (
    <span className={`${cls} inline-flex items-center h-6 text-xs px-2.5 font-medium`}>
      {name}
    </span>
  );
}

function SessionRow({ session }: { session: Session }) {
  const statusColor: Record<string, string> = {
    PENDING:   "text-amber-600 bg-amber-50 border-amber-200",
    ACCEPTED:  "text-emerald-700 bg-emerald-50 border-emerald-200",
    COMPLETED: "text-muted-foreground bg-secondary border-border",
    CANCELLED: "text-red-600 bg-red-50 border-red-200",
    REJECTED:  "text-red-600 bg-red-50 border-red-200",
    EXPIRED:   "text-muted-foreground bg-secondary border-border",
  };
  const badge =
    statusColor[session.status] ?? "text-muted-foreground bg-secondary border-border";

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{session.skillName}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
          {formatDate(session.startTime)}
          <span className="text-border mx-0.5">·</span>
          {session.mentorName}
        </p>
      </div>
      <span
        className={`inline-flex items-center h-5 px-2 text-[10px] font-medium rounded-full border flex-shrink-0 ${badge}`}
      >
        {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
      </span>
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
      <div className="max-w-5xl mx-auto px-6 py-8">

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* ── 1. GREETING ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            What are you sharing or learning today?
          </p>
        </motion.div>

        {/* ── 2. TEACH ↔ LEARN ──────────────────────────────────── */}
        {loading ? (
          <SkeletonStats />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 gap-4 mb-8"
          >
            {/* I CAN TEACH */}
            <motion.div
              variants={fadeUp}
              className="rounded-lg border p-4"
              style={{
                background: "hsl(var(--teach-bg))",
                borderColor: "hsl(var(--teach-border))",
              }}
            >
              <SectionLabel icon={BookOpen} label="I can teach" color="teach" />

              {teachSkills.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {teachSkills.map((s) => (
                      <SkillPill
                        key={`${s.skillId}-${s.skillType}`}
                        name={s.skillName ?? "Unnamed"}
                        variant="teach"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      navigate("/create-profile", { state: { startStep: 2 } })
                    }
                    className="text-xs font-medium"
                    style={{ color: "hsl(var(--teach-text))" }}
                  >
                    Manage skills →
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground flex-1">No skills yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-shrink-0"
                    onClick={() =>
                      navigate("/create-profile", { state: { startStep: 2 } })
                    }
                  >
                    Add a skill
                  </Button>
                </div>
              )}
            </motion.div>

            {/* I WANT TO LEARN */}
            <motion.div
              variants={fadeUp}
              className="rounded-lg border p-4"
              style={{
                background: "hsl(var(--learn-bg))",
                borderColor: "hsl(var(--learn-border))",
              }}
            >
              <SectionLabel icon={Compass} label="I want to learn" color="learn" />

              {learnSkills.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {learnSkills.map((s) => (
                      <SkillPill
                        key={`${s.skillId}-${s.skillType}`}
                        name={s.skillName ?? "Unnamed"}
                        variant="learn"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      navigate("/create-profile", { state: { startStep: 2 } })
                    }
                    className="text-xs font-medium"
                    style={{ color: "hsl(var(--learn-text))" }}
                  >
                    Manage goals →
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground flex-1">No goals yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-shrink-0"
                    onClick={() =>
                      navigate("/create-profile", { state: { startStep: 2 } })
                    }
                  >
                    Add a goal
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── 3. QUICK ACTIONS ──────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 gap-3 mb-8"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer group"
            onClick={() => navigate("/search")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/search")}
            aria-label="Explore people and skills"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-3.5 h-3.5 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium">Explore</p>
                <p className="text-xs text-muted-foreground">Find people through their skills</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer group"
            onClick={() => navigate("/sessions")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/sessions")}
            aria-label="View sessions"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Sessions
                  {upcomingMentor.length > 0 && (
                    <span className="ml-2 inline-flex items-center h-4 px-1.5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                      {upcomingMentor.length}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {upcomingMentor.length > 0
                    ? `${upcomingMentor.length} pending request${upcomingMentor.length > 1 ? "s" : ""}`
                    : "Upcoming and requested sessions"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden />
          </motion.div>
        </motion.div>

        {/* ── 4. UPCOMING ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
            </div>
            {upcomingLearner.length > 0 && (
              <button
                onClick={() => navigate("/sessions")}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-16 rounded-lg bg-secondary animate-pulse" />
          ) : upcomingLearner.length > 0 ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {upcomingLearner.slice(0, 4).map((s) => (
                <div key={s.id} className="px-4">
                  <SessionRow session={s} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-shrink-0"
                onClick={() => navigate("/search")}
              >
                Find someone
              </Button>
            </div>
          )}
        </motion.div>

        {/* ── 5. ACCOUNT SUMMARY (secondary) ───────────────────── */}
        {!loading && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="border-t border-border pt-6"
          >
            <p className="text-xs text-muted-foreground">
              <span
                className="hover:text-foreground cursor-pointer transition-colors"
                onClick={() => navigate("/sessions")}
              >
                {upcomingLearner.length} booked
              </span>
              <span className="mx-2 text-border">·</span>
              <span
                className="hover:text-foreground cursor-pointer transition-colors"
                onClick={() => navigate("/sessions")}
              >
                {upcomingMentor.length} pending
              </span>
              <span className="mx-2 text-border">·</span>
              <span
                className="hover:text-foreground cursor-pointer transition-colors"
                onClick={() =>
                  navigate("/create-profile", { state: { startStep: 2 } })
                }
              >
                {teachSkills.length} skill{teachSkills.length !== 1 ? "s" : ""}
              </span>
              <span className="mx-2 text-border">·</span>
              <span
                className="hover:text-foreground cursor-pointer transition-colors"
                onClick={() => navigate("/notifications")}
              >
                {feedback.length} feedback
              </span>
              <span className="mx-2 text-border">·</span>
              <span>{user.credits ?? 0} credits</span>
              <span className="mx-2 text-border">·</span>
              <span>{user.reputationScore ?? 0} rep</span>
            </p>
          </motion.div>
        )}

      </div>
    </AppLayout>
  );
};

export default Dashboard;