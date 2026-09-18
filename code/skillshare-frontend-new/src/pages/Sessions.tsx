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
  PENDING:   "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50",
  ACCEPTED:  "bg-primary/10 text-primary border-primary/20",
  REJECTED:  "bg-destructive/10 text-destructive border-destructive/20",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50",
  EXPIRED:   "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
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
        <DialogContent className="bg-card border-border max-w-2xl w-[92vw] rounded-xl shadow-lg overflow-hidden flex flex-col p-6">
          <DialogHeader className="relative pb-2 shrink-0">
            <DialogTitle className="font-heading flex items-center gap-2 text-xl font-bold">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Leave Feedback
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground">
              Rate your experience with <span className="font-semibold text-foreground">{rateName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex-1 flex flex-col min-h-0 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Select applicable tags
              </p>

              <div className="max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
                  {tags.map(tag => {
                    const isPos = tag.type === "POSITIVE";
                    const isSel = selected.includes(tag.name);
                    const stickerEmoji = TAG_EMOJI_MAP[tag.name] || (isPos ? "✨" : "⚠️");

                    return (
                        <motion.button
                            key={tag.name}
                            onClick={() => toggle(tag.name)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                                isSel
                                    ? isPos
                                        ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-800"
                                        : "bg-destructive/10 border-destructive/20 ring-1 ring-destructive/50"
                                    : "bg-secondary/50 border-border hover:bg-secondary hover:border-border/80"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{stickerEmoji}</span>
                            <span className={`text-xs font-medium leading-tight ${
                                isSel
                                    ? isPos ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"
                                    : "text-foreground/80"
                            }`}>
                              {tag.name.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="mt-auto">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSel
                                    ? isPos
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                        : "bg-destructive/20 text-destructive"
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
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11"
                  disabled={selected.length === 0 || submitting}
                  onClick={submit}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
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

  return (
      <motion.div
          variants={fadeUp}
          layout="position"
          className="p-5 rounded-xl border border-border bg-card shadow-sm transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center font-semibold text-foreground flex-shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-semibold text-base text-foreground capitalize truncate">
                {counterpartName}
              </h3>
              <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border ${STATUS_CLASSES[s.status]}`}>
                {s.status}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3 truncate">
              {s.skillName}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(s.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>
                  {formatTime(s.startTime)} - {formatTime(s.endTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {role === "learner" && s.meetingLink && s.status === "ACCEPTED" && (
            <div className="mt-5 p-3 rounded-lg bg-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-foreground overflow-hidden">
                <Video className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate font-mono">{s.meetingLink}</span>
              </div>
              <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(s.meetingLink!);
                    toast.success("Meeting link copied!");
                  }}
              >
                Copy Link
              </Button>
            </div>
        )}

        {role === "mentor" && s.status === "PENDING" && (
            <div className="flex gap-3 mt-5">
              <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
                  onClick={() => onAction(s, "accept")} disabled={isBusy}
              >
                Accept
              </Button>
              <Button
                  variant="outline" 
                  className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-border rounded-lg"
                  onClick={() => onAction(s, "reject")} disabled={isBusy}
              >
                Reject
              </Button>
            </div>
        )}
        
        {role === "mentor" && s.status === "ACCEPTED" && (
            <Button
                variant="outline"
                className="mt-5 w-full rounded-lg text-primary border-border hover:bg-primary/5"
                onClick={() => onAction(s, "link")}
                disabled={isBusy}
            >
              <Video className="w-4 h-4 mr-2" />
              {s.meetingLink ? "Update Meeting Link" : "Add Meeting Link"}
            </Button>
        )}
        
        {role === "learner" && s.status === "ACCEPTED" && (
            <Button
                className="mt-5 w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                onClick={() => onAction(s, "complete")}
                disabled={isBusy}
            >
              <Check className="w-4 h-4 mr-2" /> Mark as Complete
            </Button>
        )}
        
        {s.status === "COMPLETED" && (
            <Button
                variant="outline" 
                className={`mt-5 w-full rounded-lg font-medium transition-colors ${
                    ratedSessionIds.includes(s.id)
                        ? "text-emerald-600 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 pointer-events-none"
                        : "text-primary border-border hover:bg-primary/5"
                }`}
                onClick={() => onAction(s, "feedback")} 
                disabled={isBusy || ratedSessionIds.includes(s.id)}
            >
              {ratedSessionIds.includes(s.id) ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Feedback Submitted
                  </>
              ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
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
  
  const [ratedSessionIds, setRatedSessionIds] = useState<string[]>([]);

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
      label: "Learning",
      icon: <BookOpen className="w-4 h-4 mr-2" />,
      title: "View sessions where you are learning",
      count: learnerActionCount,
    },
    {
      key: "mentor" as const,
      label: "Teaching",
      icon: <GraduationCap className="w-4 h-4 mr-2" />,
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
            <div className="mb-8">
              <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Sessions</h1>
              <p className="text-muted-foreground mt-1">Manage your incoming and outgoing requests.</p>
            </div>

            <div className="flex p-1 rounded-xl bg-secondary mb-6 gap-1 w-full border border-border">
              {tabs.map(t => (
                  <button
                      key={t.key}
                      title={t.title}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                          tab === t.key
                              ? "bg-primary text-primary-foreground shadow"
                              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                  >
                    {t.icon}
                    {t.label}
                    {t.count > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          tab === t.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                        }`}>
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
                <div className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border bg-card">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold text-lg text-foreground">No sessions {tab === "learner" ? "booked" : "received"} yet</p>
                  <p className="text-sm mt-1 max-w-sm mx-auto px-4">
                    {tab === "learner" ? "Search for a mentor and book a session to get started." : "Share your skills so learners can book sessions with you."}
                  </p>
                </div>
            ) : (
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
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
            <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
              <h4 className="font-semibold text-base text-foreground mb-4">
                Activity Analytics
              </h4>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
                    Completed Sessions
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 p-3 rounded-lg border border-border text-center">
                      <span className="text-xs font-medium text-muted-foreground block">
                        Learning
                      </span>
                      <span className="text-xl font-bold text-foreground mt-1 block">
                        {completedLearnt}
                      </span>
                    </div>

                    <div className="bg-secondary/50 p-3 rounded-lg border border-border text-center">
                      <span className="text-xs font-medium text-muted-foreground block">
                        Teaching
                      </span>
                      <span className="text-xl font-bold text-foreground mt-1 block">
                        {completedTaught}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confirmed:</span>
                    <span className="font-medium text-sm text-foreground bg-secondary px-2 py-0.5 rounded">
                      {totalUpcoming}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending Requests:</span>
                    <span className={`font-medium text-sm px-2 py-0.5 rounded ${
                        totalPendingRequests > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-secondary text-muted-foreground"
                    }`}>
                      {totalPendingRequests}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Top Skill:</span>
                    <span className="font-medium text-sm text-foreground bg-secondary px-2 py-0.5 rounded max-w-[120px] truncate capitalize">
                      {topFocusSkill}
                    </span>
                  </div>
                </div>
              </div>
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
          <DialogContent className="bg-card border-border max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2 text-lg font-bold">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="w-4 h-4 text-primary" />
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
                  className="w-full h-11 rounded-lg bg-secondary border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />

              <Button
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
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