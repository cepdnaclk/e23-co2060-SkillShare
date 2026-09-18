import { useEffect, useState } from "react";
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
    PENDING: "text-amber-600",
    ACCEPTED: "text-primary",
    COMPLETED: "text-muted-foreground",
    CANCELLED: "text-red-500",
    REJECTED: "text-red-500",
    EXPIRED: "text-muted-foreground",
  };
  const badge = statusColor[session.status] ?? "text-muted-foreground";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border/40 last:border-0 group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 truncate mb-1 sm:mb-0">
        <span className="text-sm font-medium text-foreground">{session.skillName}</span>
        <span className="text-sm text-muted-foreground">with {session.mentorName}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{formatDate(session.startTime)}</span>
        <span className={`text-[10px] uppercase font-bold tracking-wider ${badge}`}>
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
      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col min-h-[calc(100vh-4rem)]">
        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-8" />

        {/* ── 1. GREETING & ACTIONS ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting()}, {firstName}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/search")}
              className="text-sm font-medium text-primary hover:underline"
            >
              Explore →
            </button>
            <button
              onClick={() => navigate("/sessions")}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5"
            >
              Sessions
              {upcomingMentor.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {upcomingMentor.length}
                </span>
              )}
              →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="h-20 bg-secondary/50 rounded-xl" />
              <div className="h-20 bg-secondary/50 rounded-xl" />
            </div>
            <div className="h-32 bg-secondary/50 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-14">
            
            {/* ── 2. TEACH ↔ LEARN ──────────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
              
              {/* I CAN TEACH */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    I Can Teach
                  </h2>
                  <button
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
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
                    No skills yet <span className="mx-1 text-border">·</span> Add →
                  </button>
                )}
              </div>

              {/* I WANT TO LEARN */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                    I Want To Learn
                  </h2>
                  <button
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
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
                    No goals yet <span className="mx-1 text-border">·</span> Add →
                  </button>
                )}
              </div>
            </div>

            {/* ── 3. UPCOMING ───────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                  Upcoming
                </h2>
                {(upcomingLearner.length > 0 || upcomingMentor.length > 0) && (
                  <button
                    onClick={() => navigate("/sessions")}
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                  >
                    View all →
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
                <p className="text-sm text-muted-foreground py-1">
                  No upcoming sessions.
                </p>
              )}
            </div>

            {/* ── 4. SECONDARY STATS ────────────────────────────────── */}
            {user && (
              <div className="pt-8 mt-auto border-t border-border/40">
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  
                  <button onClick={() => navigate("/sessions")} className="flex items-baseline gap-1.5 group">
                    <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{upcomingLearner.length}</span>
                    <span className="text-xs text-muted-foreground">booked</span>
                  </button>
                  
                  <button onClick={() => navigate("/sessions")} className="flex items-baseline gap-1.5 group relative">
                    <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                      {upcomingMentor.length}
                    </span>
                    <span className="text-xs text-muted-foreground">pending</span>
                    {upcomingMentor.length > 0 && <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>

                  <button onClick={() => navigate("/create-profile", { state: { startStep: 2 } })} className="flex items-baseline gap-1.5 group">
                    <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{teachSkills.length}</span>
                    <span className="text-xs text-muted-foreground">skills</span>
                  </button>

                  <button onClick={() => navigate("/notifications")} className="flex items-baseline gap-1.5 group">
                    <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{feedback.length}</span>
                    <span className="text-xs text-muted-foreground">feedback</span>
                  </button>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-medium text-foreground">{user.credits ?? 0}</span>
                    <span className="text-xs text-muted-foreground">credits</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-medium text-foreground">{user.reputationScore ?? 0}</span>
                    <span className="text-xs text-muted-foreground">rep</span>
                  </div>

                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;