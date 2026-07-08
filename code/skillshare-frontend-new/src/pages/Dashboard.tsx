import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Sparkles, ArrowRight, Calendar, TrendingUp,
  BookOpen, Coins, Star, Zap, ChevronLeft, ChevronRight,
  UserPlus, Users, CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  sessionsApi, feedbackApi, userSkillsApi, connectionsApi,
  type Session, type Feedback, type UserSkill, type Connection, type ApiError
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonStats } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";

/* ─── Spring transition preset ───────────────────────────── */
const spring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* ─── Mini Calendar ──────────────────────────────────────── */
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MiniCalendar = () => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const cells = buildCalendarGrid(viewYear, viewMonth);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-white/90">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day-of-week row */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-white/30 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <div key={idx} className="flex items-center justify-center h-7">
              {day !== null ? (
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors cursor-default
                  ${isToday
                    ? "bg-violet-500 text-white font-bold shadow-lg shadow-violet-500/40"
                    : "text-white/60 hover:bg-white/8 hover:text-white/90"
                  }`}
                >
                  {day}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Live Connections Panel ─────────────────────────────── */
const AVATAR_PALETTE = [
  { bg: "bg-orange-500/15",  text: "text-orange-400"  },
  { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400" },
  { bg: "bg-violet-500/15",  text: "text-violet-400"  },
  { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  { bg: "bg-amber-500/15",   text: "text-amber-400"   },
];

const ConnectionsList = () => {
  const [friends, setFriends] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [f, p] = await Promise.all([
      connectionsApi.getFriends().catch(() => [] as Connection[]),
      connectionsApi.getPending().catch(() => [] as Connection[]),
    ]);
    setFriends(f);
    setPending(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (conn: Connection) => {
    setActionId(conn.id);
    try {
      await connectionsApi.accept(conn.id);
      toast.success(`Connected with ${conn.requester.fullName}!`);
      await load();
    } catch { toast.error("Could not accept request."); }
    finally { setActionId(null); }
  };

  const handleReject = async (conn: Connection) => {
    setActionId(conn.id);
    try {
      await connectionsApi.reject(conn.id);
      toast.info("Request declined.");
      await load();
    } catch { toast.error("Could not decline request."); }
    finally { setActionId(null); }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-white/90 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" /> Connections
        </h3>
        {pending.length > 0 && (
          <button
            onClick={() => setShowPending(s => !s)}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {pending.length} pending
            {/* Pinging dot */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500">
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
            </span>
          </button>
        )}
      </div>

      {/* Pending requests accordion */}
      {showPending && pending.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-2">Friend Requests</p>
          {pending.map(conn => (
            <div key={conn.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/8">
              <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-violet-400">{getInitials(conn.requester.fullName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${conn.requester.id}`}
                  className="text-sm font-medium text-white/85 hover:text-white truncate block leading-tight transition-colors"
                >
                  {conn.requester.fullName}
                </Link>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(conn)}
                  disabled={actionId === conn.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                  title="Accept"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReject(conn)}
                  disabled={actionId === conn.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                  title="Decline"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="border-t border-white/8 mt-3 mb-1" />
        </div>
      )}

      {/* Friends list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 skeleton-shimmer rounded" />
                <div className="h-2.5 w-20 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-white/40">No connections yet.</p>
          <p className="text-xs text-white/25 mt-1">Visit a profile to add friends.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((conn, i) => {
            const friend = conn.requester.id === conn.receiver.id
              ? conn.receiver
              : (conn.requester.id === friends[0]?.requester.id ? conn.receiver : conn.requester);
            // Determine which side is "the friend" (not the current user)
            const pal = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
            const initials = getInitials(friend.fullName);
            return (
              <motion.div
                key={conn.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.05 * i }}
                className="flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-full ${pal.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-xs font-bold ${pal.text}`}>{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Clickable name routes to friend's profile */}
                  <Link
                    to={`/profile/${friend.id}`}
                    className="text-sm font-medium text-white/90 hover:text-white truncate block leading-tight transition-colors"
                  >
                    {friend.fullName}
                  </Link>
                  <p className="text-[11px] text-white/40 truncate">{friend.email}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Dashboard ──────────────────────────────────────────── */
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
    console.log("Dashboard useEffect running");
    console.log("Current user:", user);
    console.log("Current user id:", user?.id);

    if (!user?.id) { setLoading(false); return; }

    const uid = user.id;
    if (refreshUser) refreshUser(uid);
    setLoading(true);
    Promise.all([
      sessionsApi.getLearnerSessions(uid).catch(() => [] as Session[]),
      sessionsApi.getMentorSessions(uid).catch(() => [] as Session[]),
      feedbackApi.getForUser(uid).catch(() => [] as Feedback[]),
      userSkillsApi.getByUser(uid).catch(() => [] as UserSkill[]),
    ]).then(([ls, ms, fb, sk]) => {
      setLearnerSessions(ls); setMentorSessions(ms); setFeedback(fb); setSkills(sk);
    }).catch((err: ApiError) => {
      setError(err.message ?? "Failed to load dashboard data.");
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const upcomingLearner = learnerSessions.filter(s => ["PENDING", "ACCEPTED"].includes(s.status));
  const upcomingMentor = mentorSessions.filter(s => s.status === "PENDING");
  const teachSkills = skills.filter(s => s.id?.skillType === "TEACH");

  const stats = [
    { icon: BookOpen, label: "Booked Sessions",  value: upcomingLearner.length, color: "text-violet-400",  bg: "bg-violet-500/10",  href: "/sessions" },
    { icon: Zap,      label: "Pending Requests", value: upcomingMentor.length,  color: "text-yellow-400", bg: "bg-yellow-500/10", href: "/sessions" },
    { icon: Sparkles, label: "Skills Added",      value: teachSkills.length,    color: "text-fuchsia-400",bg: "bg-fuchsia-500/10",href: "/create-profile", hrefState: { startStep: 2 } },
    { icon: Star,     label: "Feedback Received", value: feedback.length,       color: "text-emerald-400",bg: "bg-emerald-500/10",href: "/notifications" },
  ];

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-white mb-1">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-white/50 text-sm">Here's your skill-sharing activity at a glance.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-heading font-semibold text-sm text-white/80">{user?.credits ?? 0}</span>
              <span className="text-white/40 text-xs">credits</span>
            </div>
          </div>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Main Content (2/3) ──────────────────── */}
          <div className="flex-1 lg:w-0 min-w-0 space-y-5">

            {loading ? (
              <SkeletonStats />
            ) : (
              // ── Compact horizontal metric strip (Task 5) ──────────
              <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
              >
                {stats.map((stat, i) => (
                  <motion.button
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: i * 0.05 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(stat.href, { state: stat.hrefState ?? {} })}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                      bg-white/5 backdrop-blur-sm border border-white/10
                      hover:bg-white/10 hover:border-white/20
                      cursor-pointer transition-colors shadow-sm"
                  >
                    {/* Tiny icon */}
                    <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    {/* Value + label stacked */}
                    <div className="text-left">
                      <p className={`text-base font-heading font-bold leading-none ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 leading-none whitespace-nowrap">{stat.label}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Find Mentors */}
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
                  hover:bg-white/8 hover:border-white/18 shadow-xl shadow-black/20 cursor-pointer transition-colors"
                onClick={() => navigate("/search")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-violet-400" />
                  </div>
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">Explore</Badge>
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-2">Find Mentors</h3>
                <p className="text-sm text-white/50 mb-4">
                  Search by skill to discover mentors who match what you want to learn.
                </p>
                <div className="flex items-center gap-1.5 text-violet-400 text-sm font-medium">
                  Search Skills <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Session Requests */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.15 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
                  hover:bg-white/8 hover:border-white/18 shadow-xl shadow-black/20 cursor-pointer transition-colors"
                onClick={() => navigate("/sessions")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-yellow-400" />
                  </div>
                  {upcomingMentor.length > 0 && (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                      {upcomingMentor.length} pending
                    </Badge>
                  )}
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-2">Session Requests</h3>
                <p className="text-sm text-white/50 mb-4">
                  {upcomingMentor.length > 0
                    ? `You have ${upcomingMentor.length} session request(s) waiting for your response.`
                    : "No pending session requests right now."}
                </p>
                <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium">
                  Manage Sessions <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </div>

            {/* Teaching Skills */}
            {!loading && teachSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-white/90">Skills You're Teaching</h3>
                  <Button variant="ghost" size="sm"
                    onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                    className="text-white/50 hover:text-white/80 hover:bg-white/8 text-xs"
                  >
                    + Add More
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teachSkills.map(us => (
                    <Badge key={us.id.skillId + us.id.skillType}
                      className="px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg">
                      {us.skill?.name ?? "Unnamed Skill"}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Upcoming sessions */}
            {!loading && upcomingLearner.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.25 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-white/90 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" /> Your Upcoming Sessions
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")}
                    className="text-white/50 hover:text-white/80 hover:bg-white/8 text-xs">
                    View all
                  </Button>
                </div>
                <div className="space-y-2">
                  {upcomingLearner.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/8">
                      <div>
                        <p className="font-medium text-sm text-white/85">{s.skill.name} with {s.mentor.fullName}</p>
                        <p className="text-xs text-white/40">{formatDate(s.startTime)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.status === "ACCEPTED" ? "status-accepted" :
                        s.status === "PENDING" ? "status-pending" : ""
                      }`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reputation */}
            {!loading && user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.3 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20"
              >
                <h3 className="font-heading font-bold text-white/90 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-fuchsia-400" /> Your Reputation
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                    <p className="text-xl font-heading font-bold gradient-text">{user.reputationScore}</p>
                    <p className="text-xs text-white/40 mt-1">Rep Score</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                    <p className="text-xl font-heading font-bold text-yellow-400">{user.credits}</p>
                    <p className="text-xs text-white/40 mt-1">Credits</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Sidebar (1/3) ─────────────────── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }}>
              <MiniCalendar />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.3 }}>
              <ConnectionsList />
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
