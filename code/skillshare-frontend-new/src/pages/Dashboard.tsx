import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Sparkles, ArrowRight, Calendar, TrendingUp,
  BookOpen, Coins, Star, Zap, Award, Users, Search, Trophy, Flame, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { sessionsApi, feedbackApi, userSkillsApi, type Session, type Feedback, type UserSkill, type ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonStats } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// ── REUSABLE GAMIFIED STICKER POPUP WRAPPER ──
interface TooltipProps {
  children: React.ReactNode;
  title: string;
  titleColor: string;
  tooltipText: string;
  emoji: string;
  Icon: LucideIcon;
  iconColor: string;
  tooltipBg: string;
  textColor: string;
}

function HeaderChipWithTooltip({
                                 children,
                                 title,
                                 titleColor,
                                 tooltipText,
                                 emoji,
                                 Icon,
                                 iconColor,
                                 tooltipBg,
                                 textColor
                               }: TooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
      <div
          className="relative flex flex-col items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        {/* Target Anchor Component */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {children}
        </motion.div>

        {/* Duolingo Sticker Card Dialog with themed color backgrounds */}
        <AnimatePresence>
          {isHovered && (
              <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.93 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.93 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className={`absolute top-full mt-2.5 z-50 w-52 p-4 rounded-2xl border border-border shadow-[0_12px_32px_rgba(0,0,0,0.15)] pointer-events-none text-center ${tooltipBg}`}
              >
                {/* Arrow Pin */}
                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-t border-l border-border ${tooltipBg}`} />

                {/* Centered Large Sticker Graphic */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-background border border-border text-xl shadow-inner">
                    <span>{emoji}</span>
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-md bg-muted border border-border shadow-sm">
                      <Icon className={`w-3 h-3 ${iconColor}`} />
                    </div>
                  </div>

                  {/* Typography Structure */}
                  <div className="flex flex-col gap-0.5 mt-1">
                    <h4 className={`text-xs font-black tracking-wider uppercase ${titleColor}`}>
                      {title}
                    </h4>
                    <p className={`text-[11px] leading-relaxed font-bold px-1 ${textColor}`}>
                      {tooltipText}
                    </p>
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

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

  const upcomingLearner = learnerSessions.filter(s => ["PENDING", "ACCEPTED"].includes(s.status));
  const upcomingMentor = mentorSessions.filter(s => s.status === "PENDING");
  const teachSkills = skills.filter(s => s.skillType === "TEACH");

  const stats = [
    { icon: BookOpen, label: "Booked Sessions",  value: upcomingLearner.length, grad: "from-violet-500 to-purple-600", href: "/sessions" },
    { icon: Zap,      label: "Pending Requests", value: upcomingMentor.length,  grad: "from-amber-500 to-orange-500",  href: "/sessions" },
    { icon: Sparkles, label: "Skills Added",     value: teachSkills.length,     grad: "from-fuchsia-500 to-purple-500", href: "/create-profile", hrefState: { startStep: 2 } },
    { icon: Star,     label: "Feedback Received",value: feedback.length,        grad: "from-orange-500 to-amber-400",  href: "/notifications" },
  ];

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const userXp = user?.xp ?? 0;
  const userLevel = user?.level ?? 1;

  return (
      <AppLayout>
        <div className="container mx-auto px-6 py-10 max-w-5xl">

          {/* Welcome Header Widget */}
          <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8 p-6 rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 text-white shadow-[0_10px_30px_rgba(139,92,246,0.15)]"
          >
            <div>
              <h1 className="text-3xl font-heading font-extrabold flex items-center gap-2 tracking-tight">
                Welcome back, {firstName}!
                <motion.span
                    animate={{ rotate: [0, 18, -8, 18, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.5 }}
                    className="inline-block origin-[70%_70%]"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-white/90 text-sm font-medium mt-1">
                Here's your skill-sharing activity at a glance.
              </p>
            </div>

            {/* Eye-Friendly High-Contrast Glassmorphism Chip Array */}
            <div className="flex items-center flex-wrap gap-2.5 self-start lg:self-auto">

              {/* 1. SEARCH CHIP (Sleek Frosty Silver) */}
              <HeaderChipWithTooltip
                  title="Search System"
                  titleColor="text-slate-700 font-black"
                  tooltipText="Find courses, skills, or peer mentors instantly."
                  emoji="🔍"
                  Icon={Search}
                  iconColor="text-slate-600"
                  tooltipBg="bg-white"
                  textColor="text-slate-500"
              >
                <button
                    onClick={() => navigate("/search")}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/95 border border-white text-slate-700 shadow-md transition-all hover:bg-white"
                >
                  <Search className="w-4 h-4 font-bold" />
                </button>
              </HeaderChipWithTooltip>

              {/* 2. LEVEL CHIP (Bright Amethyst Purple - Highly Emphasized) */}
              <HeaderChipWithTooltip
                  title={`Level ${userLevel}`}
                  titleColor="text-violet-700 font-black"
                  tooltipText={`Keep learning and sharing skills to reach Level ${userLevel + 1}!`}
                  emoji="👑"
                  Icon={Trophy}
                  iconColor="text-violet-600"
                  tooltipBg="bg-violet-50"
                  textColor="text-violet-600"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl bg-white border-2 border-violet-400 text-xs font-black tracking-tight text-violet-700 shadow-md">
                  <Trophy className="w-3.5 h-3.5 fill-violet-200 text-violet-600" />
                  <span className="uppercase text-[9px] tracking-wider font-extrabold text-violet-500">LVL</span>
                  <span className="font-extrabold text-violet-900">{userLevel}</span>
                </div>
              </HeaderChipWithTooltip>

              {/* 3. XP CHIP (Bright Mango Orange) */}
              <HeaderChipWithTooltip
                  title={`${userXp} Total XP`}
                  titleColor="text-orange-700 font-black"
                  tooltipText={`${100 - (userXp % 100)} more XP until your next level milestone.`}
                  emoji="⚡"
                  Icon={Flame}
                  iconColor="text-orange-500"
                  tooltipBg="bg-orange-50"
                  textColor="text-orange-600"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl bg-white border-2 border-orange-400 text-xs font-black tracking-tight text-orange-700 shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-orange-100 text-orange-500 animate-pulse" />
                  <span className="font-extrabold text-orange-900">{userXp}</span>
                  <span className="uppercase text-[9px] font-extrabold text-orange-500">XP</span>
                </div>
              </HeaderChipWithTooltip>

              {/* 4. CREDITS CHIP (Bright Electric Teal/Blue) */}
              <HeaderChipWithTooltip
                  title={`${user?.credits ?? 0} Balance`}
                  titleColor="text-sky-700 font-black"
                  tooltipText="Spend tokens to book master sessions or teach to earn them."
                  emoji="💎"
                  Icon={Coins}
                  iconColor="text-sky-500"
                  tooltipBg="bg-sky-50"
                  textColor="text-sky-600"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl bg-white border-2 border-sky-400 text-xs font-black tracking-tight text-sky-700 shadow-md">
                  <Coins className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-extrabold text-sky-900">{user?.credits ?? 0}</span>
                  <span className="text-sky-500 text-[9px] font-extrabold uppercase tracking-wide">Credits</span>
                </div>
              </HeaderChipWithTooltip>

            </div>
          </motion.div>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

          {/* Stats */}
          <div className="mb-8">
            {loading ? (
                <SkeletonStats />
            ) : (
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  {stats.map((stat, i) => (
                      <motion.div
                          key={i}
                          variants={fadeUp}
                          whileHover={{ y: -4 }}
                          onClick={() => navigate(stat.href, { state: stat.hrefState ?? {} })}
                          className="p-4 rounded-xl bg-card border-2 border-border cursor-pointer hover:border-transparent hover:shadow-lg transition-all"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.grad} flex items-center justify-center mb-3 shadow-md`}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-heading font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </motion.div>
                  ))}
                </motion.div>
            )}
          </div>

          {/* Action Cards */}
          <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 gap-4 mb-8"
          >
            {/* Find Mentors */}
            <motion.div variants={fadeUp} className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-400/10 border-2 border-violet-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-violet-500 text-white border-0">
                  Explore
                </Badge>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Find Mentors</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search by skill to discover mentors who match what you want to learn.
              </p>
              <Button onClick={() => navigate("/search")} className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white border-0">
                Search Skills <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Pending Mentor Requests */}
            <motion.div variants={fadeUp} className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-400/10 border-2 border-orange-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                {upcomingMentor.length > 0 && (
                    <Badge className="bg-amber-500 text-white border-0">
                      {upcomingMentor.length} pending
                    </Badge>
                )}
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Session Requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {upcomingMentor.length > 0
                    ? `You have ${upcomingMentor.length} session request(s) waiting for your response.`
                    : "No pending session requests right now."}
              </p>
              <Button onClick={() => navigate("/sessions")} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-400 hover:opacity-90 text-white border-0">
                Manage Sessions <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Teaching Skills */}
          {!loading && teachSkills.length > 0 && (
              <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-purple-400/10 border-2 border-fuchsia-500/30 mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    Skills You're Teaching
                  </h3>
                  <button
                      onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                      className="text-sm text-fuchsia-500 font-medium hover:underline"
                  >
                    + Add More
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teachSkills.map((us, i) => (
                      <Badge
                          key={`${us.skillId}-${us.skillType}`}
                          className={`text-white border-0 px-3 py-1 ${
                              ["bg-fuchsia-500", "bg-violet-500", "bg-orange-500", "bg-purple-500"][i % 4]
                          }`}
                      >
                        {us.skillName ?? "Unnamed Skill"}
                      </Badge>
                  ))}
                </div>
              </motion.div>
          )}

          {/* Upcoming sessions */}
          {!loading && upcomingLearner.length > 0 && (
              <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-card border-2 border-border mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Your Upcoming Sessions
                  </h3>
                  <button onClick={() => navigate("/sessions")} className="text-sm text-violet-500 font-medium hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {upcomingLearner.slice(0, 3).map(s => (
                      <motion.div
                          whileHover={{ x: 3 }}
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary"
                      >
                        <div>
                          <p className="text-sm font-medium">{s.skillName} with {s.mentorName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {formatDate(s.startTime)}
                          </p>
                        </div>
                        <Badge className="bg-orange-500 text-white border-0">
                          {s.status}
                        </Badge>
                      </motion.div>
                  ))}
                </div>
              </motion.div>
          )}

          {/* Reputation */}
          {!loading && user && (
              <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-card border-2 border-border"
              >
                <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Your Reputation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    <p className="text-2xl font-heading font-bold">{user.reputationScore}</p>
                    <p className="text-xs text-white/90 mt-1">Rep Score</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white">
                    <p className="text-2xl font-heading font-bold">{user.credits}</p>
                    <p className="text-xs text-white/90 mt-1">Credits</p>
                  </div>
                </div>
              </motion.div>
          )}
        </div>
      </AppLayout>
  );
};

export default Dashboard;