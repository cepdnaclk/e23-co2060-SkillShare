import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, Sparkles, ArrowRight, Calendar, TrendingUp,
  BookOpen, Coins, Star, Zap
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

    if (!user?.id) {
      setLoading(false)
      return;
    }

    const uid = user.id;
    setLoading(true);
    Promise.all([
      sessionsApi.getLearnerSessions(uid).catch(() => [] as Session[]),
      sessionsApi.getMentorSessions(uid).catch(() => [] as Session[]),
      feedbackApi.getForUser(uid).catch(() => [] as Feedback[]),
      userSkillsApi.getByUser(uid).catch(() => [] as UserSkill[]),
    ]).then(([ls, ms, fb, sk]) => {
      setLearnerSessions(ls);
      setMentorSessions(ms);
      setFeedback(fb);
      setSkills(sk);
    }).catch((err: ApiError) => {
      setError(err.message ?? "Failed to load dashboard data.");
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const upcomingLearner = learnerSessions.filter(s => ["PENDING", "ACCEPTED"].includes(s.status));
  const upcomingMentor = mentorSessions.filter(s => s.status === "PENDING");
  const teachSkills = skills.filter(s => s.id?.skillType === "TEACH");

  const stats = [
    { icon: BookOpen, label: "Booked Sessions",   value: upcomingLearner.length, color: "text-primary",      bg: "bg-primary/10",      href: "/sessions" },
    { icon: Zap,      label: "Pending Requests",  value: upcomingMentor.length,  color: "text-yellow-400",  bg: "bg-yellow-400/10",   href: "/sessions" },
    { icon: Sparkles, label: "Skills Added",       value: teachSkills.length,     color: "text-accent",      bg: "bg-accent/10",       href: "/create-profile", hrefState: { startStep: 2 } },
    { icon: Star,     label: "Feedback Received",  value: feedback.length,        color: "text-emerald-400", bg: "bg-emerald-400/10",  href: "/notifications" },
  ];

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-muted-foreground text-sm">Here's your skill-sharing activity at a glance.</p>
            </div>
            {/* Credits chip */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-heading font-semibold text-sm">{user?.credits ?? 0}</span>
              <span className="text-muted-foreground text-xs">credits</span>
            </div>
          </div>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {/* Stats */}
        <div className="mb-8">
          {loading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => navigate(stat.href, { state: stat.hrefState ?? {} })}
                  className="p-4 rounded-xl bg-card border border-border glow-border cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-heading font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Find Mentors */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 glow-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Explore</Badge>
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Find Mentors</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search by skill to discover mentors who match what you want to learn.
            </p>
            <Button onClick={() => navigate("/search")} className="gap-2">
              Search Skills <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Pending Mentor Requests */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 glow-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
              {upcomingMentor.length > 0 && (
                <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 text-xs">
                  {upcomingMentor.length} pending
                </Badge>
              )}
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Session Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {upcomingMentor.length > 0
                ? `You have ${upcomingMentor.length} session request(s) waiting for your response.`
                : "No pending session requests right now."}
            </p>
            <Button onClick={() => navigate("/sessions")} variant="outline" className="gap-2">
              Manage Sessions <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Teaching Skills */}
        {!loading && teachSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold">Skills You're Teaching</h3>
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
              >
                + Add More
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {teachSkills.map(us => (
                <Badge key={us.id.skillId + us.id.skillType} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20">
                  {us.skill?.name?? "Unnamed Skill"}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming sessions */}
        {!loading && upcomingLearner.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-card border border-border mt-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Your Upcoming Sessions
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")}>View all</Button>
            </div>
            <div className="space-y-3">
              {upcomingLearner.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                  <div>
                    <p className="font-medium text-sm">{s.skill.name} with {s.mentor.fullName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.startTime)}</p>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="p-6 rounded-2xl bg-card border border-border mt-4"
          >
            <h3 className="font-heading font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-accent" /> Your Reputation
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl bg-secondary">
                <p className="text-xl font-heading font-bold gradient-text">{user.reputationScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Rep Score</p>
              </div>

              <div className="p-3 rounded-xl bg-secondary">
                <p className="text-xl font-heading font-bold text-yellow-400">{user.credits}</p>
                <p className="text-xs text-muted-foreground mt-1">Credits</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
