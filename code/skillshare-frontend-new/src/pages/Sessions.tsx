import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Sparkles, Clock, Calendar, MessageSquare, ChevronRight
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

const STATUS_CLASSES: Record<SessionStatus, string> = {
  PENDING:   "status-pending",
  ACCEPTED:  "status-accepted",
  REJECTED:  "status-rejected",
  COMPLETED: "status-completed",
  EXPIRED:   "status-expired",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// ─── Feedback Dialog ─────────────────────────────────────────
interface FeedbackDialogProps {
  session: Session | null;
  rateName: string;          // name of the person being rated
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
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Leave Feedback
          </DialogTitle>
          <DialogDescription>
            Rate your session with <strong>{rateName}</strong> on {session ? fmt(session.startTime) : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Select all that apply:</p>
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
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-red-500/20 border-red-500/40 text-red-400"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
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
          <Button
            className="w-full h-11 gap-2"
            disabled={selected.length === 0 || submitting}
            onClick={submit}
          >
            {submitting ? "Submitting…" : <><Sparkles className="w-4 h-4" /> Submit Feedback</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Session Card ─────────────────────────────────────────────
interface SessionCardProps {
  session: Session;
  role: "learner" | "mentor";
  onAction: (session: Session, action: "accept" | "reject" | "complete" | "feedback" | "link") => void;  actionLoading: string | null;
  ratedSessionIds: string[];}
const SessionCard = ({ session: s, role, onAction, actionLoading, ratedSessionIds }: SessionCardProps) => {
  const isBusy = actionLoading === s.id;
  const counterpart = role === "learner" ? s.mentor : s.learner;
  const initials = counterpart.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-card border border-border glow-border"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading font-semibold text-sm">{counterpart.fullName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[s.status]}`}>
              {s.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Skill: <span className="text-foreground">{s.skill.name}</span></p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(s.startTime)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> → {fmt(s.endTime)}</span>
          </div>
        </div>
      </div>

      {role === "learner" && s.meetingLink && (
          <div className="mt-3 p-3 rounded-xl bg-secondary text-xs">
            <p className="text-muted-foreground mb-1">Meeting Link</p>

            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-primary">{s.meetingLink}</span>

              <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
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

      {/* Action buttons */}
      {role === "mentor" && s.status === "PENDING" && (
        <div className="flex gap-2 mt-4">
          <Button
            size="sm" className="flex-1 gap-1.5 h-8"
            onClick={() => onAction(s, "accept")} disabled={isBusy}
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </Button>
          <Button
            size="sm" variant="outline" className="flex-1 gap-1.5 h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onAction(s, "reject")} disabled={isBusy}
          >
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      )}
      {role === "mentor" && s.status === "ACCEPTED" && (
          <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => onAction(s, "link")}
              disabled={isBusy}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {s.meetingLink ? "Update Meeting Link" : "Add Meeting Link"}
          </Button>
      )}
      {role === "learner" && s.status === "ACCEPTED" && (
          <Button
              size="sm"
              className="mt-4 w-full gap-1.5 h-8"
              onClick={() => onAction(s, "complete")}
              disabled={isBusy}
          >
            <Check className="w-3.5 h-3.5" /> Mark Complete
          </Button>
      )}
      {s.status === "COMPLETED" && !ratedSessionIds.includes(s.id) && (        <Button
          size="sm" variant="outline" className="mt-4 w-full gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => onAction(s, "feedback")} disabled={isBusy}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Rate {role === "learner" ? s.mentor.fullName : s.learner.fullName}
        </Button>
      )}
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const Sessions = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState<"learner" | "mentor">(() => {
    if (location.state?.tab === "mentor") return "mentor";
    if (location.state?.tab === "learner") return "learner";
    return "learner"; // default only when opening Sessions normally
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

  const handleAction = async (session: Session, action: "accept" | "reject" | "complete" | "feedback"|"link") => {
    if (action === "feedback") {
      // Determine who is being rated: if current user is learner → rate the mentor; if mentor → rate the learner
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
  const learnerActionCount = learnerSessions.filter(
      s =>
          s.status === "ACCEPTED"
  ).length;

  const mentorActionCount = mentorSessions.filter(
      s => s.status === "PENDING"
  ).length;

  const tabs = [
    { key: "learner" as const, label: "As Learner", count: learnerActionCount },
    { key: "mentor" as const, label: "As Mentor", count: mentorActionCount },
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
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">My Sessions</h1>
          <p className="text-muted-foreground text-sm mb-6">Manage all your skill-sharing sessions.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex p-1 rounded-xl bg-secondary mb-6 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === t.key ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {loading ? (
          <SkeletonList count={3} />
        ) : currentSessions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No sessions {tab === "learner" ? "booked" : "received"} yet</p>
            <p className="text-sm mt-1">
              {tab === "learner" ? "Search for a mentor and book a session to get started." : "Share your skills so learners can book sessions with you."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
          </div>
        )}
      </div>

      <FeedbackDialog
          session={feedbackSession}
          rateName={feedbackRateName}
          onClose={() => setFeedbackSession(null)}
          onSubmitted={(sessionId) => {
            setRatedSessionIds(prev => {
              const updated = prev.includes(sessionId) ? prev : [...prev, sessionId];

              if (user?.id) {
                localStorage.setItem(
                    `ratedSessionIds_${user.id}`,
                    JSON.stringify(updated)
                );
              }

              return updated;
            });

            setFeedbackSession(null);
          }}
      />
      <Dialog open={!!linkSession} onOpenChange={() => setLinkSession(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Meeting Link</DialogTitle>
            <DialogDescription>
              Send the meeting link to the learner for this accepted session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Paste Zoom / Google Meet link here"
                className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm outline-none focus:border-primary"
            />

            <Button
                className="w-full h-11"
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
