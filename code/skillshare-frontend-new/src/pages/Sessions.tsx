import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Sparkles, Clock, Calendar, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

/* ─── Spring preset ──────────────────────────────────────── */
const spring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 };

const STATUS_CLASSES: Record<SessionStatus, string> = {
  PENDING:   "status-pending",
  ACCEPTED:  "status-accepted",
  REJECTED:  "status-rejected",
  COMPLETED: "status-completed",
  EXPIRED:   "status-expired",
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

// ─── Feedback Dialog ─────────────────────────────────────────

const TAG_EMOJI_MAP: Record<string, string> = {
  // Positive Stickers
  EXCELLENT_COMMUNICATOR: "🗣️",
  DEEP_KNOWLEDGE:        "🧠",
  VERY_PATIENT:         "⏳",
  WELL_PREPARED:        "📚",
  HIGHLY_ENGAGED:       "🔥",
  PUNCTUAL:             "⏰",
  RESPECTFUL:           "🤝",
  FRIENDLY:             "😊",

  // Negative/Warning Stickers
  POOR_EXPLANATION:     "🤷",
  UNPREPARED:           "❌",
  DISTRACTED:           "📱",
  LEFT_EARLY:           "🏃‍♂️",
  NOISY_ENVIRONMENT:    "🔊",
  RUDE_BEHAVIOR:        "😠",
  LATE_TO_SESSION:      "🐢",
  NO_SHOW:              "👻",
};

// ─── Optimized Layout Feedback Dialog ─────────────────────────────────────────
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
      toast.success("Feedback submitted! 🎉");
      onSubmitted(session.id);
      onClose();
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to submit feedback.");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f14]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-violet-400" /> Leave Feedback
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Rate your session with <strong className="text-white/70">{rateName}</strong> on {session ? fmt(session.startTime) : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div>
            <p className="text-sm text-white/50 mb-3">Select all that apply:</p>
            <div className="grid grid-cols-2 gap-2">
              {tags.map(tag => {
                const isPos = tag.type === "POSITIVE";
                const isSel = selected.includes(tag.name);
                return (
                  <button
                    key={tag.name}
                    onClick={() => toggle(tag.name)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSel
                        ? isPos
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <span>{isPos ? "✅" : "⚠️"} {tag.name.replace(/_/g, " ")}</span>
                    <span className={`block text-[10px] mt-0.5 ${isPos ? "text-emerald-400/70" : "text-red-400/70"}`}>
                      {isPos ? "+" : ""}{tag.weight} rep
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} transition={spring}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500
              text-white font-semibold text-sm shadow-lg shadow-violet-500/25
              flex items-center justify-center gap-2
              disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            disabled={selected.length === 0 || submitting}
            onClick={submit}
          >
            {submitting ? "Submitting…" : <><Sparkles className="w-4 h-4" /> Submit Feedback</>}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Session Card ─────────────────────────────────────────────
interface SessionCardProps {
  session: Session;
  role: "learner" | "mentor";
  onAction: (session: Session, action: "accept" | "reject" | "complete" | "feedback" | "link") => void;
  actionLoading: string | null;
  ratedSessionIds: string[];
}
const SessionCard = ({ session: s, role, onAction, actionLoading, ratedSessionIds }: SessionCardProps) => {
  const isBusy = actionLoading === s.id;
  const counterpart = role === "learner" ? s.mentor : s.learner;
  const initials = counterpart.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // 🎨 Overhauled Dynamic Background & Border Matrix
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
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring}
      whileHover={{ scale: 1.01 }}
      className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10
        hover:bg-white/8 hover:border-white/18 shadow-xl shadow-black/20 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading font-semibold text-sm text-white/90">{counterpart.fullName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[s.status]}`}>
              {s.status}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-1">Skill: <span className="text-white/70">{s.skill.name}</span></p>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(s.startTime)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> → {fmt(s.endTime)}</span>
          </div>
        </div>
      </div>

      {/* Meeting link display */}
      {role === "learner" && s.meetingLink && s.status === "ACCEPTED" && (
        <div className="mt-3 p-3 rounded-xl bg-black/20 border border-white/8 text-xs">
          <p className="text-white/40 mb-1">Meeting Link</p>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-violet-400">{s.meetingLink}</span>
            <Button size="sm" variant="outline"
              className="h-7 text-xs bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => { navigator.clipboard.writeText(s.meetingLink!); toast.success("Meeting link copied!"); }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {role === "mentor" && s.status === "PENDING" && (
        <div className="flex gap-2 mt-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={spring}
            onClick={() => onAction(s, "accept")} disabled={isBusy}
            className="flex-1 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={spring}
            onClick={() => onAction(s, "reject")} disabled={isBusy}
            className="flex-1 h-8 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </motion.button>
        </div>
      )}
      {role === "mentor" && s.status === "ACCEPTED" && (
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} transition={spring}
          onClick={() => onAction(s, "link")} disabled={isBusy}
          className="mt-4 w-full h-8 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-400 hover:bg-violet-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {s.meetingLink ? "Update Meeting Link" : "Add Meeting Link"}
        </motion.button>
      )}
      {role === "learner" && s.status === "ACCEPTED" && (
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} transition={spring}
          onClick={() => onAction(s, "complete")} disabled={isBusy}
          className="mt-4 w-full h-8 rounded-lg bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-300 hover:from-violet-500/30 hover:to-fuchsia-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
        >
          <Check className="w-3.5 h-3.5" /> Mark Complete
        </motion.button>
      )}
      {s.status === "COMPLETED" && !ratedSessionIds.includes(s.id) && (
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} transition={spring}
          onClick={() => onAction(s, "feedback")} disabled={isBusy}
          className="mt-4 w-full h-8 rounded-lg bg-white/5 border border-white/12 text-white/60 hover:bg-white/10 hover:text-white/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Rate {role === "learner" ? s.mentor.fullName : s.learner.fullName}
        </motion.button>
      )}
    </motion.div>
  );
};

// ─── Main Sessions page ───────────────────────────────────────
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
  const [ratedSessionIds, setRatedSessionIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`ratedSessionIds_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

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

  const handleAction = async (session: Session, action: "accept" | "reject" | "complete" | "feedback" | "link") => {
    if (action === "feedback") {
      const rateName = user?.id === session.learner.id ? session.mentor.fullName : session.learner.fullName;
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
        await sessionsApi.updateStatus(session.id, user.id, "ACCEPTED");
        toast.success("Session accepted!");
      } else if (action === "reject") {
        await sessionsApi.updateStatus(session.id, user.id, "REJECTED");
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
    { key: "learner" as const, label: "As Learner", count: learnerActionCount },
    { key: "mentor" as const, label: "As Mentor",  count: mentorActionCount },
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
    } finally { setSavingLink(false); }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white mb-1">My Sessions</h1>
          <p className="text-white/45 text-sm mb-6">Manage all your skill-sharing sessions.</p>
        </motion.div>

        {/* Glass tab switcher */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === t.key
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  tab === t.key ? "bg-violet-500 text-white" : "bg-white/10 text-white/40"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
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

        {loading ? (
          <SkeletonList count={3} />
        ) : currentSessions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-white/40">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Calendar className="w-7 h-7 opacity-50" />
            </div>
            <p className="font-medium text-white/60">No sessions {tab === "learner" ? "booked" : "received"} yet</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">
              {tab === "learner" ? "Search for a mentor and book a session to get started." : "Share your skills so learners can book sessions with you."}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {currentSessions.map(s => (
                <SessionCard
                  key={s.id} session={s} role={tab}
                  onAction={handleAction} actionLoading={actionLoading}
                  ratedSessionIds={ratedSessionIds}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <FeedbackDialog
        session={feedbackSession} rateName={feedbackRateName}
        onClose={() => setFeedbackSession(null)}
        onSubmitted={(sessionId) => {
          setRatedSessionIds(prev => {
            const updated = prev.includes(sessionId) ? prev : [...prev, sessionId];
            if (user?.id) localStorage.setItem(`ratedSessionIds_${user.id}`, JSON.stringify(updated));
            return updated;
          });
          setFeedbackSession(null);
        }}
      />

      {/* Meeting link dialog */}
      <Dialog open={!!linkSession} onOpenChange={() => setLinkSession(null)}>
        <DialogContent className="bg-[#0f0f14]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-white">Add Meeting Link</DialogTitle>
            <DialogDescription className="text-white/50">
              Send the meeting link to the learner for this accepted session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="Paste Zoom / Google Meet link here"
              className="w-full h-10 rounded-xl bg-black/30 border border-white/10 focus:border-white/30 px-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors backdrop-blur-sm"
            />
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} transition={spring}
              disabled={!meetingLink.trim() || savingLink}
              onClick={saveMeetingLink}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500
                text-white font-semibold text-sm shadow-lg shadow-violet-500/25
                flex items-center justify-center gap-2
                disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {savingLink ? "Sending..." : "Send Link"}
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Sessions;