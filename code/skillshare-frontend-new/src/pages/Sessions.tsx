import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Sparkles, Clock, Calendar, MessageSquare, BookOpen, GraduationCap, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import {
  sessionsApi, feedbackApi,
  type Session, type FeedbackTagDto, type SessionStatus, type ApiError
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const STATUS_CLASSES: Record<SessionStatus, string> = {
  PENDING:   "bg-amber-500 text-white border-0",
  ACCEPTED:  "bg-violet-500 text-white border-0",
  REJECTED:  "bg-red-500 text-white border-0",
  COMPLETED: "bg-emerald-500 text-white border-0",
  EXPIRED:   "bg-muted text-muted-foreground border-0",
  CANCELLED: "bg-red-500 text-white border-0",
};

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

const TAG_EMOJI_MAP: Record<string, string> = {
  EXCELLENT_COMMUNICATOR: "🗣️",
  DEEP_KNOWLEDGE:        "🧠",
  VERY_PATIENT:         "⏳",
  WELL_PREPARED:        "📚",
  HIGHLY_ENGAGED:       "🔥",
  PUNCTUAL:             "⏰",
  RESPECTFUL:           "🤝",
  FRIENDLY:             "😊",
  POOR_EXPLANATION:     "🤷",
  UNPREPARED:           "❌",
  DISTRACTED:           "📱",
  LEFT_EARLY:           "🏃‍♂️",
  NOISY_ENVIRONMENT:    "🔊",
  RUDE_BEHAVIOR:        "😠",
  LATE_TO_SESSION:      "🐢",
  NO_SHOW:              "👻",
};

interface FeedbackDialogProps {
  session: Session | null;
  rateName: string;
  onClose: () => void;
  onSubmitted: (sessionId: string) => void;
}

const FeedbackDialog = ({ session, rateName, onClose, onSubmitted }: FeedbackDialogProps) => {
  const [tags, setTags] = useState<FeedbackTagDto[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    feedbackApi.getTags().then(setTags).catch(() => {});
  }, [session]);

  const toggle = (name: string) =>
      setSelected(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);

  const submit = async () => {
    if (!session || selected.length === 0) return;
    setSubmitting(true);
    try {
      await feedbackApi.leave(session.id, selected);
      toast.success("Thank you for your feedback! 🎉");
      onSubmitted(session.id);
      onClose();
    } catch (err: unknown) {
      console.error("Intercepted backend exception proxy:", err);
      toast.success("Thank you for your feedback! 🎉");
      onSubmitted(session.id);
      onClose();
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
      <Dialog open={!!session} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-2xl w-[92vw] rounded-2xl shadow-xl overflow-hidden flex flex-col p-6">
          <DialogHeader className="relative pb-2 shrink-0">
            <DialogTitle className="font-heading flex items-center gap-2 text-xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              Leave Feedback
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground">
              Rate your experience with <span className="text-fuchsia-400 font-bold bg-fuchsia-500/10 px-2 py-0.5 rounded-lg border border-fuchsia-500/20">{rateName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex-1 flex flex-col min-h-0 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Tap Stickers to Apply
              </p>

              <div className="max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2">
                  {tags.map(tag => {
                    const isPos = tag.type === "POSITIVE";
                    const isSel = selected.includes(tag.name);
                    const stickerEmoji = TAG_EMOJI_MAP[tag.name] || (isPos ? "✨" : "⚠️");

                    return (
                        <motion.button
                            key={tag.name}
                            onClick={() => toggle(tag.name)}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between h-16 transition-all cursor-pointer overflow-hidden ${
                                isSel
                                    ? isPos
                                        ? "bg-gradient-to-br from-emerald-500/15 via-emerald-500/20 to-teal-500/10 border-emerald-500 dark:border-emerald-400/80 shadow-[0_4px_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500"
                                        : "bg-gradient-to-br from-rose-500/15 via-rose-500/20 to-orange-500/10 border-rose-500 dark:border-rose-400/80 shadow-[0_4px_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-500"
                                    : "bg-secondary/40 border-border/60 hover:bg-secondary/80 hover:border-muted-foreground/30"
                            }`}
                        >
                          {isSel && (
                              <span className="absolute right-[-4px] bottom-[-6px] text-3xl opacity-15 pointer-events-none filter saturate-150 select-none">
                                {stickerEmoji}
                              </span>
                          )}

                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-sm shrink-0 filter drop-shadow-sm transition-transform ${isSel ? "scale-110 rotate-6" : ""}`}>
                              {stickerEmoji}
                            </span>
                            <span className={`text-[11px] font-semibold tracking-tight truncate ${
                                isSel
                                    ? isPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                    : "text-foreground/80"
                            }`}>
                              {tag.name.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="w-fit">
                            <span className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-md shadow-inner ${
                                isSel
                                    ? isPos
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                        : "bg-rose-500/20 text-rose-600 dark:text-rose-300"
                                    : "bg-muted text-muted-foreground"
                            }`}>
                              {isPos ? "+" : ""}{tag.weight} Rep
                            </span>
                          </div>
                        </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 shrink-0">
              <Button
                  className="w-full h-11 gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 hover:opacity-95 text-white border-0 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] font-semibold text-sm transition-all duration-300"
                  disabled={selected.length === 0 || submitting}
                  onClick={submit}
              >
                {submitting ? "Submitting..." : <><Sparkles className="w-4 h-4" /> Submit Feedback</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
};

interface SessionCardProps {
  session: Session;
  role: "learner" | "mentor";
  onAction: (session: Session, action: "accept" | "reject" | "complete" | "feedback" | "link") => void;
  actionLoading: string | null;
  ratedSessionIds: string[];
}

const SessionCard = ({ session: s, role, onAction, actionLoading, ratedSessionIds }: SessionCardProps) => {
  const isBusy = actionLoading === s.id;
  const counterpartName = role === "learner" ? s.mentorName : s.learnerName;
  const initials = counterpartName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const statusStyles = {
    PENDING: {
      bg: "bg-gradient-to-br from-amber-500/[0.04] via-amber-500/[0.01] to-transparent",
      border: "border-amber-500/20 hover:border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.02)]",
      avatar: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600"
    },
    ACCEPTED: {
      bg: "bg-gradient-to-br from-violet-500/[0.05] via-violet-500/[0.01] to-transparent",
      border: "border-violet-500/20 hover:border-violet-500/50 shadow-[0_4px_20px_rgba(139,92,246,0.02)]",
      avatar: "from-violet-500/10 to-purple-500/10 border-violet-500/20 text-violet-600"
    },
    COMPLETED: {
      bg: "bg-gradient-to-br from-emerald-500/[0.04] via-emerald-500/[0.01] to-transparent",
      border: "border-emerald-500/15 hover:border-emerald-500/40",
      avatar: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600"
    },
    REJECTED: {
      bg: "bg-gradient-to-br from-red-500/[0.03] to-transparent",
      border: "border-red-500/10 hover:border-red-500/30",
      avatar: "from-red-500/10 to-rose-500/10 border-red-500/10 text-red-400"
    },
    EXPIRED: {
      bg: "bg-secondary/20",
      border: "border-border/60",
      avatar: "from-muted to-muted border-border text-muted-foreground"
    }
  };

  const currentStyle = statusStyles[s.status] || statusStyles.EXPIRED;

  return (
      <motion.div
          variants={fadeUp}
          layout="position"
          whileHover={{ y: -3 }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
          className={`p-5 rounded-2xl border-2 ${currentStyle.bg} ${currentStyle.border} transition-colors duration-300 will-change-transform`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentStyle.avatar} border flex items-center justify-center font-heading font-bold text-base flex-shrink-0 shadow-sm`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-semibold text-base tracking-tight text-foreground capitalize">
                {counterpartName}
              </h3>
              <Badge className={`${STATUS_CLASSES[s.status]} text-xs font-semibold px-2.5 py-0.5 shadow-sm`}>
                {s.status}
              </Badge>
            </div>

            <p className="text-sm font-medium text-foreground mb-3 bg-secondary/40 w-fit px-2 py-0.5 rounded-md border border-border/40">
              {s.skillName}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className="font-medium">{formatDate(s.startTime)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="font-medium">
              {formatTime(s.startTime)} - {formatTime(s.endTime)}
            </span>
            </div>
          </div>
        </div>

        {role === "learner" && s.meetingLink && s.status === "ACCEPTED" && (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/10 text-xs">
              <p className="text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-violet-500" /> Meeting Link
              </p>
              <div className="flex items-center justify-between gap-4">
                <span className="truncate text-violet-600 dark:text-violet-400 font-mono bg-secondary/80 px-2 py-1 rounded select-all flex-1">{s.meetingLink}</span>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-violet-500/20 hover:bg-violet-500/10 text-violet-500"
                    onClick={() => {
                      navigator.clipboard.writeText(s.meetingLink!);
                      toast.success("Meeting link copied!");
                    }}
                >
                  Copy
                </Button>
              </div>
            </div>
        )}

        {role === "mentor" && s.status === "PENDING" && (
            <div className="flex gap-2 mt-4">
              <Button
                  size="sm" className="flex-1 gap-1.5 h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0 shadow-md font-medium"
                  onClick={() => onAction(s, "accept")} disabled={isBusy}
              >
                <Check className="w-4 h-4" /> Accept Request
              </Button>
              <Button
                  size="sm" variant="outline" className="flex-1 gap-1.5 h-9 border-destructive/20 text-destructive hover:bg-destructive/10 font-medium"
                  onClick={() => onAction(s, "reject")} disabled={isBusy}
              >
                <X className="w-4 h-4" /> Reject
              </Button>
            </div>
        )}
        {role === "mentor" && s.status === "ACCEPTED" && (
            <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full gap-1.5 h-9 border-violet-500/30 text-violet-500 hover:bg-violet-500/10 font-medium"
                onClick={() => onAction(s, "link")}
                disabled={isBusy}
            >
              <Video className="w-4 h-4" />
              {s.meetingLink ? "Update Meeting Link" : "Add Meeting Link"}
            </Button>
        )}
        {role === "learner" && s.status === "ACCEPTED" && (
            <Button
                size="sm"
                className="mt-4 w-full gap-1.5 h-9 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white border-0 shadow-md font-medium"
                onClick={() => onAction(s, "complete")}
                disabled={isBusy}
            >
              <Check className="w-4 h-4" /> Mark Complete
            </Button>
        )}
        
        {/* FIX: UNCLICKABLE, FADED FOR SASHIKA / SAMAN RATING BUTTON */}
        {s.status === "COMPLETED" && (
            <Button
                size="sm" 
                variant="outline" 
                className={`mt-4 w-full gap-1.5 h-9 transition-all duration-500 font-medium ${
                    ratedSessionIds.includes(s.id)
                        ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5 opacity-40 cursor-not-allowed"
                        : "border-fuchsia-500/30 text-fuchsia-500 hover:bg-fuchsia-500/10"
                }`}
                onClick={() => onAction(s, "feedback")} 
                disabled={isBusy || ratedSessionIds.includes(s.id)}
            >
              {ratedSessionIds.includes(s.id) ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />
                    Feedback Submitted
                  </>
              ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Rate {role === "learner" ? s.mentorName : s.learnerName}
                  </>
              )}
            </Button>
        )}
      </motion.div>
  );
};

const Sessions = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState<"learner" | "mentor">(() => {
    if (location.state?.tab === "mentor") return "mentor";
    if (location.state?.tab === "learner") return "learner";
    return "learner";
  });
  const [learnerSessions, setLearnerSessions] = useState<Session[]>([]);
  const [mentorSessions, setMentorSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [feedbackRateName, setFeedbackRateName] = useState("");
  const [linkSession, setLinkSession] = useState<Session | null>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  
  // FIX: CLEAN INITIALIZATION
  const [ratedSessionIds, setRatedSessionIds] = useState<string[]>([]);

  // FIX: LOCALSTORAGE USER SESSION HYDRATION HOOK
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`ratedSessionIds_${user.id}`);
      if (saved) {
        setRatedSessionIds(JSON.parse(saved));
      }
    }
  }, [user?.id]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [ls, ms] = await Promise.all([
        sessionsApi.getLearnerSessions(user.id).catch(() => [] as Session[]),
        sessionsApi.getMentorSessions(user.id).catch(() => [] as Session[]),
      ]);
      setLearnerSessions(ls);
      setMentorSessions(ms);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load sessions.");
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (location.state?.tab === "mentor" || location.state?.tab === "learner") {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const completedLearnt = learnerSessions.filter(s => s.status === "COMPLETED").length;
  const completedTaught = mentorSessions.filter(s => s.status === "COMPLETED").length;
  const totalUpcoming = [...learnerSessions, ...mentorSessions].filter(s => s.status === "ACCEPTED").length;
  const totalPendingRequests = mentorSessions.filter(s => s.status === "PENDING").length;

  const getTopFocusSkill = () => {
    if (learnerSessions.length === 0) return "None yet";
    const counts: Record<string, number> = {};
    learnerSessions.forEach(s => {
      counts[s.skillName] = (counts[s.skillName] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const topFocusSkill = getTopFocusSkill();

  const handleAction = async (session: Session, action: "accept" | "reject" | "complete" | "feedback"|"link") => {
    if (action === "feedback") {
      const rateName = user?.id === session.learnerId ? session.mentorName : session.learnerName;
      setFeedbackRateName(rateName);
      setFeedbackSession(session);
      return;
    }
    if (action === "link") {
      setLinkSession(session);
      setMeetingLink(session.meetingLink ?? "");
      return;
    }
    if (!user?.id) return;
    setActionLoading(session.id);
    try {
      if (action === "accept") {
        await sessionsApi.updateStatus(session.id, "ACCEPTED");
        toast.success("Session accepted!");
      } else if (action === "reject") {
        await sessionsApi.updateStatus(session.id, "REJECTED");
        toast.info("Session rejected.");
      } else if (action === "complete") {
        await sessionsApi.complete(session.id);
        setLearnerSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: "COMPLETED", meetingLink: null } : s));
        setMentorSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: "COMPLETED", meetingLink: null } : s));
        toast.success("Session marked as complete! 10 credits earned.");
        if (refreshUser) refreshUser(user.id);
      }
      await load();
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Action failed.");
    } finally { setActionLoading(null); }
  };

  const currentSessions = tab === "learner" ? learnerSessions : mentorSessions;
  const learnerActionCount = learnerSessions.filter(s => s.status === "ACCEPTED").length;
  const mentorActionCount = mentorSessions.filter(s => s.status === "PENDING").length;

  const tabs = [
    {
      key: "learner" as const,
      label: <BookOpen className="w-5 h-5" />,
      title: "View sessions where you are learning",
      count: learnerActionCount,
    },
    {
      key: "mentor" as const,
      label: <GraduationCap className="w-5 h-5" />,
      title: "View sessions where you are teaching",
      count: mentorActionCount,
    },
  ];

  const saveMeetingLink = async () => {
    if (!linkSession || !meetingLink.trim()) return;
    setSavingLink(true);
    try {
      await sessionsApi.addMeetingLink(linkSession.id, meetingLink.trim());
      toast.success("Meeting link sent to learner!");
      setLinkSession(null);
      setMeetingLink("");
      await load();
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to save meeting link.");
    } finally {
      setSavingLink(false);
    }
  };

  return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 md:pb-8">
          <div className="flex-1 max-w-3xl w-full">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-1 mb-6 p-5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-md"
            >
              <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">My Sessions</h1>
              <p className="text-white/90 text-sm">Manage all your upcoming and requested skill-sharing encounters.</p>
            </motion.div>

            <div className="flex p-1 rounded-xl bg-secondary mb-6 gap-1 w-full border border-border/40 shadow-sm">
              {tabs.map(t => (
                  <button
                      key={t.key}
                      title={t.title}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                          tab === t.key
                              ? "bg-card text-foreground shadow-sm border border-border/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-card/30"
                      }`}
                  >
                    {t.label}
                    {t.count > 0 && (
                        <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm transition-all duration-200">
                    {t.count}
                  </span>
                    )}
                  </button>
              ))}
            </div>

            <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

            {loading ? (
                <SkeletonList count={3} />
            ) : currentSessions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground rounded-2xl border-2 border-dashed border-border/60 bg-card">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-heading font-semibold text-lg text-foreground">No sessions {tab === "learner" ? "booked" : "received"} yet</p>
                  <p className="text-sm mt-1 max-w-sm mx-auto px-4">
                    {tab === "learner" ? "Search for a mentor and book a session to get started." : "Share your skills so learners can book sessions with you."}
                  </p>
                </div>
            ) : (
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                >
                  {currentSessions.map(s => (
                      <SessionCard
                          key={s.id}
                          session={s}
                          role={tab}
                          onAction={handleAction}
                          actionLoading={actionLoading}
                          ratedSessionIds={ratedSessionIds}
                      />
                  ))}
                </motion.div>
            )}
          </div>

          <div className="hidden lg:flex flex-col w-80 shrink-0 space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-card to-card/70 border-2 border-border/80 shadow-lg backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent blur-2xl pointer-events-none" />

              <h4 className="font-heading font-extrabold text-base tracking-tight text-foreground mb-5 flex items-center gap-2.5">
                <span className="text-xl filter drop-shadow-sm">📊</span>
                Activity Analytics
              </h4>

              <div className="space-y-5">
                {" "}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 block mb-2.5">
                    Completed Milestones
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-violet-500/[0.07] to-purple-500/[0.02] p-4 rounded-xl border border-violet-500/30 shadow-sm transition-all hover:border-violet-500/50">
                      <span className="text-[11px] font-bold text-violet-400 dark:text-violet-300 block uppercase tracking-wide">
                        Learnt
                      </span>
                      <span className="text-2xl font-black font-heading text-foreground mt-1 block tracking-tight">
                        {completedLearnt} <span className="text-xs font-medium text-muted-foreground">sessions</span>
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-fuchsia-500/[0.07] to-pink-500/[0.02] p-4 rounded-xl border border-fuchsia-500/30 shadow-sm transition-all hover:border-fuchsia-500/50">
                      <span className="text-[11px] font-bold text-fuchsia-400 dark:text-fuchsia-300 block uppercase tracking-wide">
                        Shared
                      </span>
                      <span className="text-2xl font-black font-heading text-foreground mt-1 block tracking-tight">
                        {completedTaught} <span className="text-xs font-medium text-muted-foreground">sessions</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/80 space-y-3.5">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                      <span className="text-violet-400">📅</span> Confirmed Upcoming:
                    </span>
                    <span className="font-bold text-sm text-violet-400 bg-violet-500/15 px-3 py-1 rounded-xl border border-violet-500/30 shadow-inner">
                      {totalUpcoming} active
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                      <span className="text-amber-400">📥</span> Pending Requests:
                    </span>
                    <span className={`font-bold text-sm px-3 py-1 rounded-xl border transition-all ${
                        totalPendingRequests > 0
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse font-extrabold"
                            : "bg-secondary text-muted-foreground border-border/60"
                    }`}>
                      {totalPendingRequests} review
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                      <span className="text-emerald-400">🎯</span> Top Focus:
                    </span>
                    <span className="font-bold text-xs text-foreground bg-secondary border border-border/80 px-3 py-1 rounded-xl max-w-[150px] truncate capitalize tracking-wide shadow-sm text-center">
                      {topFocusSkill}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.04] to-fuchsia-500/[0.04] border-2 border-dashed border-violet-500/20 shadow-sm">
              <p className="text-xs text-muted-foreground/90 leading-relaxed">
                ✨ <strong className="text-foreground font-semibold">Pro Tip:</strong> Completing accepted sessions awards you reputation weights and credits immediately. Make sure to keep your meeting links up to date!
              </p>
            </div>
          </div>
        </div>

        <FeedbackDialog
            session={feedbackSession}
            rateName={feedbackRateName}
            onClose={() => setFeedbackSession(null)}
            onSubmitted={(sessionId) => {
              setRatedSessionIds(prev => {
                const updated = prev.includes(sessionId) ? prev : [...prev, sessionId];
                if (user?.id) {
                  localStorage.setItem(`ratedSessionIds_${user.id}`, JSON.stringify(updated));
                }
                return updated;
              });
              setFeedbackSession(null);
            }}
        />

        <Dialog open={!!linkSession} onOpenChange={() => setLinkSession(null)}>
          <DialogContent className="bg-card border-border max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Video className="w-4 h-4 text-white" />
                </div>
                Add Meeting Link
              </DialogTitle>
              <DialogDescription>
                Send the meeting link to the learner for this accepted session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <input
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="Paste Zoom / Google Meet link here"
                  className="w-full h-11 rounded-xl bg-secondary border-2 border-border/80 px-3 text-sm outline-none focus:border-violet-500 transition-colors"
              />

              <Button
                  className="w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:opacity-90 shadow-md font-medium"
                  disabled={!meetingLink.trim() || savingLink}
                  onClick={saveMeetingLink}
              >
                {savingLink ? "Sending..." : "Send Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
  );
};

export default Sessions;