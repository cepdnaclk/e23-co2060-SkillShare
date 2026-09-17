import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Layers,
  Search,
  Users,
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

const getHour = () => new Date().getHours();
const greeting = () => {
  const h = getHour();
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

/** Compact section label */
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
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={
          styles.bg
            ? { background: styles.bg, border: `1px solid ${styles.border}` }
            : { background: "hsl(var(--secondary))" }
        }
      >
        <Icon
          className="w-3.5 h-3.5"
          aria-hidden
          style={styles.text ? { color: styles.text } : undefined}
        />
      </div>
      <p
        className="text-[11px] font-semibold tracking-[0.1em] uppercase"
        style={styles.text ? { color: styles.text } : { color: "hsl(var(--muted-foreground))" }}
      >
        {label}
      </p>
    </div>
  );
}

/** A single skill pill — teach or learn style */
function SkillPill({
  name,
  variant,
}: {
  name: string;
  variant: "teach" | "learn" | "neutral";
}) {
  const cls =
    variant === "teach"
      ? "skill-badge-teach"
      : variant === "learn"
      ? "skill-badge-learn"
      : "inline-flex items-center h-6 text-xs px-2.5 rounded-full border border-border bg-secondary text-secondary-foreground font-medium";
  return (
    <span className={`${cls} inline-flex items-center h-6 text-xs px-2.5 font-medium`}>
      {name}
    </span>
  );
}

/** Compact session row */
function SessionRow({ session }: { session: Session }) {
  const statusColor: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50 border-amber-200",
    ACCEPTED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    COMPLETED: "text-muted-foreground bg-secondary border-border",
    CANCELLED: "text-red-600 bg-red-50 border-red-200",
    REJECTED: "text-red-600 bg-red-50 border-red-200",
    EXPIRED: "text-muted-foreground bg-secondary border-border",
  };
  const badge = statusColor[session.status] ?? "text-muted-foreground bg-secondary border-border";

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">
          {session.skillName}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
          {formatDate(session.startTime)}
          <span className="mx-1">·</span>
          with {session.mentorName}
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

  /* ── Stats for secondary section ─────────────────────────── */
  const statItems = [
    {
      label: "Booked sessions",
      value: upcomingLearner.length,
      href: "/sessions",
    },
    {
      label: "Pending requests",
      value: upcomingMentor.length,
      href: "/sessions",
    },
    {
      label: "Skills shared",
      value: teachSkills.length,
      href: "/create-profile",
      hrefState: { startStep: 2 },
    },
    {
      label: "Feedback received",
      value: feedback.length,
      href: "/notifications",
    },
  ];

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
            Ready to share something or learn something new?
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
              className="rounded-lg border p-5"
              style={{
                background: "hsl(var(--teach-bg))",
                borderColor: "hsl(var(--teach-border))",
              }}
            >
              <SectionLabel icon={BookOpen} label="I can teach" color="teach" />

              {teachSkills.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-4">
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
                <div>
                  <p className="text-xs text-muted-foreground mb-3">
                    You haven't added any teaching skills yet.
                    Share something you know with the community.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
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
              className="rounded-lg border p-5"
              style={{
                background: "hsl(var(--learn-bg))",
                borderColor: "hsl(var(--learn-border))",
              }}
            >
              <SectionLabel icon={Compass} label="I want to learn" color="learn" />

              {learnSkills.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-4">
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
                    Manage learning goals →
                  </button>
                </>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Tell others what you want to learn so they can find you.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      navigate("/create-profile", { state: { startStep: 2 } })
                    }
                  >
                    Add learning goals
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
          {/* Explore people */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer group"
            onClick={() => navigate("/search")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/search")}
            aria-label="Explore people and skills"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium">Explore people</p>
                <p className="text-xs text-muted-foreground">Find someone who knows what you want to learn</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden />
          </motion.div>

          {/* Session requests */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer group"
            onClick={() => navigate("/sessions")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/sessions")}
            aria-label="View sessions"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-primary" aria-hidden />
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
                    ? `${upcomingMentor.length} request${upcomingMentor.length > 1 ? "s" : ""} waiting for your response`
                    : "Manage your teaching and learning sessions"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden />
          </motion.div>
        </motion.div>

        {/* ── 4. UPCOMING SESSIONS ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
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
            <div className="h-20 rounded-lg bg-secondary animate-pulse" />
          ) : upcomingLearner.length > 0 ? (
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {upcomingLearner.slice(0, 4).map((s) => (
                <div key={s.id} className="px-4">
                  <SessionRow session={s} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card px-5 py-6">
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect with someone and plan your next learning exchange.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 text-xs gap-1.5"
                onClick={() => navigate("/search")}
              >
                <Users className="w-3.5 h-3.5" aria-hidden />
                Find someone to connect with
              </Button>
            </div>
          )}
        </motion.div>

        {/* ── 5. SECONDARY STATS ────────────────────────────────── */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-foreground">Overview</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statItems.map((stat) => (
                <button
                  key={stat.label}
                  onClick={() =>
                    navigate(stat.href, { state: stat.hrefState ?? {} })
                  }
                  className="text-left p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 hover:border-primary/20 transition-colors"
                >
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </button>
              ))}
            </div>

            {/* Account stats — reputation, credits — secondary */}
            {user && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xl font-bold text-foreground">
                    {user.reputationScore ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reputation score</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xl font-bold text-foreground">
                    {user.credits ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Credits</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;