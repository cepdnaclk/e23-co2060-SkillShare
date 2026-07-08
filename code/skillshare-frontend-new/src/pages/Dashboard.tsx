import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Sparkles, ArrowRight, Calendar, TrendingUp,
  BookOpen, Coins, Star, Zap, ChevronLeft, ChevronRight, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { sessionsApi, feedbackApi, userSkillsApi, type Session, type Feedback, type UserSkill, type ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonStats } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

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

/* ─── Friends / Connections ──────────────────────────────── */
interface Friend {
  id: number; name: string; initials: string; role: string;
  avatarBg: string; avatarText: string;
}

const MOCK_FRIENDS: Friend[] = [
  { id: 1, name: "Arjun Perera",      initials: "AP", role: "React Mentor",   avatarBg: "bg-orange-500/15",  avatarText: "text-orange-400" },
  { id: 2, name: "Sasha Nilmini",     initials: "SN", role: "UI/UX Learner",  avatarBg: "bg-fuchsia-500/15", avatarText: "text-fuchsia-400" },
  { id: 3, name: "Dev Krishnamurthy", initials: "DK", role: "ML Engineer",    avatarBg: "bg-violet-500/15",  avatarText: "text-violet-400" },
  { id: 4, name: "Nadia Farooq",      initials: "NF", role: "Python Mentor",  avatarBg: "bg-orange-500/15",  avatarText: "text-orange-400" },
  { id: 5, name: "Taro Yamamoto",     initials: "TY", role: "Node.js Dev",    avatarBg: "bg-fuchsia-500/15", avatarText: "text-fuchsia-400" },
];

const FriendsList = () => (
  <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20">
    <h3 className="font-heading font-bold text-sm text-white/90 mb-4">Connections</h3>
    <div className="space-y-3">
      {MOCK_FRIENDS.map((friend, i) => (
        <motion.div
          key={friend.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: 0.05 * i }}
          className="flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-full ${friend.avatarBg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
            <span className={`text-xs font-bold ${friend.avatarText}`}>{friend.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate leading-tight">{friend.name}</p>
            <p className="text-[11px] text-white/40 truncate">{friend.role}</p>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 transition-all hover:text-violet-400 hover:bg-white/8 flex-shrink-0"
            aria-label={`Message ${friend.name}`}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  </div>
);

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

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mb-8">
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

            {/* Stats */}
            {loading ? (
              <SkeletonStats />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(stat.href, { state: stat.hrefState ?? {} })}
                    className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
                      hover:bg-white/8 hover:border-white/20 shadow-xl shadow-black/20
                      cursor-pointer transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} border border-white/8 flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-heading font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
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
              <FriendsList />
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
