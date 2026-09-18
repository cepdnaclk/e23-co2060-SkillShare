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
  Award,
  Bell,
  Star,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { sessionsApi } from "@/api/sessions.api";
import { feedbackApi } from "@/api/feedback.api";
import { userSkillsApi } from "@/api/userSkills.api";
import { trendingApi } from "@/api/dashboard.api";
import { notificationsApi } from "@/api/notifications.api";
import type { 
  SessionResponse as Session, 
  FeedbackResponse as Feedback, 
  UserSkillDto as UserSkill,
  TrendingSkillDto,
  Notification
} from "@/api/types";
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

const formatRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes || 1}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

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

function NotificationRow({ item }: { item: Notification }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-transparent hover:border-border hover:bg-secondary/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bell className="w-3.5 h-3.5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground line-clamp-2 leading-snug">{item.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

function TrendingSkillRow({ item }: { item: TrendingSkillDto }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card border border-border shadow-sm">
      <div className="min-w-0 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <Star className="w-4 h-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate text-foreground">{item.skillName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.totalSessions} active sessions
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-xs font-semibold text-primary">
        Explore
      </Button>
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
  const [inbox, setInbox] = useState<Notification[]>([]);
  const [trending, setTrending] = useState<TrendingSkillDto[]>([]);
  
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
      notificationsApi.getInbox().catch(() => [] as Notification[]),
      trendingApi.getTopSharingSkills().catch(() => [] as TrendingSkillDto[]),
    ])
      .then(([ls, ms, fb, sk, inboxRes, trendRes]) => {
        setLearnerSessions(ls);
        setMentorSessions(ms);
        setFeedback(fb);
        setSkills(sk);
        setInbox(inboxRes);
        setTrending(trendRes);
      })
      .catch((err: ApiError) => {
        setError(err.message ?? "Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, [user?.id, refreshUser]);

  /* ── Derived data ─────────────────────────────────────────── */
  const learnSkills = skills.filter((s) => s.skillType === "LEARN");
  const upcomingLearner = learnerSessions.filter((s) => ["PENDING", "ACCEPTED"].includes(s.status));
  const incomingRequests = mentorSessions.filter((s) => s.status === "PENDING");
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  const reputationLabel = user?.reputationScore != null ? "Reputation Score" : "Learning Credits";
  const reputationValue = user?.reputationScore != null ? user.reputationScore : (user?.credits ?? 0);
  const reputationIcon = user?.reputationScore != null ? Award : Zap;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-10 pb-20">
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* ── LEFT/MAIN COLUMN ───────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* 1. SUMMARY CARDS */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Compass, label: "Skills Learned", value: String(learnSkills.length), iconBg: "bg-learn-bg border-learn-border", iconColor: "text-learn-text" },
                  { icon: BookOpen, label: "Incoming Requests", value: String(incomingRequests.length), iconBg: "bg-teach-bg border-teach-border", iconColor: "text-teach-text" },
                  { icon: Calendar, label: "Upcoming Sessions", value: String(upcomingLearner.length), iconBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
                  { icon: reputationIcon, label: reputationLabel, value: String(reputationValue), iconBg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-card border border-border shadow-sm p-4 flex flex-col items-start hover:shadow-md transition-shadow">
                    <div className={`w-8 h-8 rounded-full border ${stat.iconBg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-4 h-4 ${stat.iconColor}`} aria-hidden />
                    </div>
                    <p className="text-2xl font-semibold text-foreground mb-0.5 tracking-tight">{stat.value}</p>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* 2. MAIN HERO */}
              <motion.div variants={fadeUp} className="relative overflow-hidden rounded-card bg-card border border-border shadow-sm flex items-stretch">
                <div className="relative z-10 px-8 py-10 md:py-12 md:px-10 flex-1 flex flex-col justify-center bg-white/60 backdrop-blur-3xl">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight tracking-tight mb-3">
                    Grow your skills.<br />Help others grow.
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md">
                    Join thousands of students exchanging knowledge. Master a new subject or earn credits by mentoring peers.
                  </p>
                  <div>
                    <Button 
                      size="default" 
                      className="rounded-xl font-semibold shadow-sm px-6"
                      onClick={() => navigate("/search")}
                    >
                      Find a mentor
                    </Button>
                  </div>
                </div>
                {/* CSS Composition for visual interest */}
                <div className="hidden md:block relative w-1/3 min-w-[200px] bg-primary/5 border-l border-border/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-teach-bg/30 to-learn-bg/30" />
                  <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8Y2lyY2xlIGN4PSI0IiBjeT0iNCIgcj0iMSIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPg==')] text-primary" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                </div>
              </motion.div>

              {/* 3. CONTINUE LEARNING */}
              <motion.div variants={fadeUp} className="space-y-4">
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
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {learnSkills.slice(0, 3).map((s) => (
                      <SkillCard key={`${s.skillId}-${s.skillType}`} skill={s} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-card border border-border rounded-2xl border-dashed">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <Compass className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">No learning goals yet</h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
                      Add skills you want to learn to get personalized recommendations.
                    </p>
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}>
                      Add a goal
                    </Button>
                  </div>
                )}
              </motion.div>

              {/* 4. INCOMING REQUESTS */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Incoming Requests</h2>
                  {incomingRequests.length > 0 && (
                    <button 
                      onClick={() => navigate("/sessions")}
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      View all
                    </button>
                  )}
                </div>
                
                {incomingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {incomingRequests.slice(0, 3).map((s) => (
                      <SessionRow key={s.id} session={s} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-card border border-border rounded-2xl border-dashed">
                    <p className="text-sm text-muted-foreground">No incoming requests to teach right now.</p>
                  </div>
                )}
              </motion.div>

              {/* 5. RECOMMENDED FOR YOU */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Recommended For You</h2>
                </div>
                {trending.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {trending.slice(0, 4).map((t) => (
                      <TrendingSkillRow key={t.skillName} item={t} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-card border border-border rounded-2xl border-dashed">
                    <p className="text-sm text-muted-foreground">No recommendations available at the moment.</p>
                  </div>
                )}
              </motion.div>

            </div>

            {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
            <div className="space-y-8">
              
              {/* 1. UPCOMING SESSIONS */}
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

              {/* 2. RECENT ACTIVITY (NOTIFICATIONS) */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                </div>
                {inbox.length > 0 ? (
                  <div className="space-y-1">
                    {inbox.slice(0, 4).map((item) => (
                      <NotificationRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center bg-card border border-border rounded-2xl">
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                  </div>
                )}
              </motion.div>

              {/* 3. TEACH A SKILL CTA */}
              <motion.div variants={fadeUp} className="bg-teach-bg border border-teach-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-teach-border/50 flex items-center justify-center mb-4">
                    <GraduationCap className="w-5 h-5 text-teach-text" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">Have a skill to share?</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Help another student learn something useful while earning credits.
                  </p>
                  <Button 
                    className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                  >
                    Teach a skill
                  </Button>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;