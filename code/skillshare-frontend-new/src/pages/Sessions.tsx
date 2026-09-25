import { useEffect, useState } from "react";
import { Check, X, Clock, Calendar, Video, MessageSquare, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import { sessionsApi } from "@/api/sessions.api";
import { feedbackApi } from "@/api/feedback.api";
import { type Session, type FeedbackTagDto, type SessionStatus } from "@/api/types";
import { type ApiError } from "@/api/client";

import { useAuth } from "@/context/AuthContext";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Import Report Modal
import { ReportUserModal } from "@/components/ReportUserModal";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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
      toast.success("Thank you for your feedback.");
      onSubmitted(session.id);
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Feedback submitted.");
      onSubmitted(session.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Leave Feedback</DialogTitle>
          <DialogDescription>
            How was your session with {rateName}? Select applicable traits.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto">
            {tags.map(tag => {
              const isSel = selected.includes(tag.name);
              const label = tag.name.replace(/_/g, " ").toLowerCase();
              return (
                <button
                  key={tag.name}
                  onClick={() => toggle(tag.name)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${
                    isSel
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={selected.length === 0 || submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface MeetingLinkDialogProps {
  session: Session | null;
  onClose: () => void;
  onSaved: (sessionId: string, meetingLink: string) => void;
}

const MeetingLinkDialog = ({ session, onClose, onSaved }: MeetingLinkDialogProps) => {
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setLink(session.meetingLink || "");
    }
  }, [session]);

  const submit = async () => {
    if (!session || !link.trim()) return;
    setSubmitting(true);
    try {
      await sessionsApi.addMeetingLink(session.id, link.trim());
      toast.success("Meeting link sent to learner!");
      onSaved(session.id, link.trim());
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to send meeting link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Send Meeting Link
          </DialogTitle>
          <DialogDescription>
            Provide a meeting URL (Google Meet, Zoom, Teams) for your session with {session?.learnerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label htmlFor="meeting-link-input" className="text-sm font-medium text-foreground">
              Meeting URL
            </label>
            <Input
              id="meeting-link-input"
              placeholder="e.g. https://meet.google.com/abc-defg-hij"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="bg-background"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The learner will receive this link directly on their Sessions dashboard and via notifications.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!link.trim() || submitting}>
            {submitting ? "Sending..." : "Send Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SessionRowProps {
  session: Session;
  role: "learner" | "mentor";
  onAction: (session: Session, action: "accept" | "reject" | "complete" | "feedback" | "cancel" | "link") => void;
  onReport: (session: Session) => void;
  actionLoading: string | null;
  ratedSessionIds: string[];
}

const SessionRow = ({ session: s, role, onAction, onReport, actionLoading, ratedSessionIds }: SessionRowProps) => {
  const isBusy = actionLoading === s.id;
  const counterpartName = role === "learner" ? s.mentorName : s.learnerName;

  const statusColor: Record<string, string> = {
    PENDING: "text-amber-600",
    ACCEPTED: "text-primary",
    COMPLETED: "text-muted-foreground",
    CANCELLED: "text-red-500",
    REJECTED: "text-red-500",
    EXPIRED: "text-muted-foreground",
  };
  const badgeClass = statusColor[s.status] ?? "text-muted-foreground";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border/60 rounded-xl bg-card hover:border-border transition-colors gap-4">

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground truncate">{s.skillName}</span>
          <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-secondary ${badgeClass}`}>
            {s.status}
          </span>
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{role === "learner" ? "with" : "student"} {counterpartName}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(s.startTime)}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatTime(s.startTime)}</span>
        </div>
        {s.meetingLink && s.status === "ACCEPTED" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a  
              href={s.meetingLink.startsWith("http://") || s.meetingLink.startsWith("https://") ? s.meetingLink : `https://${s.meetingLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Video className="w-3.5 h-3.5" /> Join Call
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(s.meetingLink!);
                toast.success("Meeting link copied to clipboard!");
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-mono bg-secondary/60 hover:bg-secondary px-2.5 py-1.5 rounded-lg transition-colors border border-border/40 truncate max-w-xs"
              title="Click to copy link"
            >
              {s.meetingLink}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {role === "mentor" && s.status === "PENDING" && (
          <>
            <Button size="sm" variant="outline" onClick={() => onAction(s, "reject")} disabled={isBusy} className="h-8 text-xs text-red-500 hover:text-red-600">
              Reject
            </Button>
            <Button size="sm" onClick={() => onAction(s, "accept")} disabled={isBusy} className="h-8 text-xs">
              Accept
            </Button>
          </>
        )}
        {role === "mentor" && s.status === "ACCEPTED" && (
          <Button
            size="sm"
            variant={s.meetingLink ? "outline" : "default"}
            onClick={() => onAction(s, "link")}
            disabled={isBusy}
            className="h-8 text-xs gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            {s.meetingLink ? "Edit Meeting Link" : "Send Meeting Link"}
          </Button>
        )}
        {((s.status === "PENDING" && role === "learner") || (s.status === "ACCEPTED" && new Date(s.startTime) > new Date())) && (
          <Button size="sm" variant="outline" onClick={() => onAction(s, "cancel")} disabled={isBusy} className="h-8 text-xs text-red-500 hover:text-red-600">
            Cancel
          </Button>
        )}
        {role === "learner" && s.status === "ACCEPTED" && (
          <Button size="sm" variant="outline" onClick={() => onAction(s, "complete")} disabled={isBusy} className="h-8 text-xs">
            Mark Completed
          </Button>
        )}
        {/* FIX (Bug 5): both roles can now leave feedback on a COMPLETED session, not just the learner */}
        {(role === "learner" || role === "mentor") && s.status === "COMPLETED" && !ratedSessionIds.includes(s.id) && (
          <Button size="sm" variant="secondary" onClick={() => onAction(s, "feedback")} disabled={isBusy} className="h-8 text-xs">
            Leave Feedback
          </Button>
        )}

        {/* 🚩 Report Session Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReport(s)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Report this session"
        >
          <Flag className="w-4 h-4" />
        </Button>
      </div>
    </div>
    
  );
};

// Renders the Upcoming/Past grouped list for a single role — shared by both tabs
interface SessionGroupProps {
  role: "learner" | "mentor";
  upcoming: Session[];
  past: Session[];
  emptyLabel: string;
  onAction: (session: Session, action: "accept" | "reject" | "complete" | "feedback" | "cancel" | "link") => void;
  onReport: (session: Session) => void;
  actionLoading: string | null;
  ratedSessionIds: string[];
}

const SessionGroup = ({ role, upcoming, past, emptyLabel, onAction, onReport, actionLoading, ratedSessionIds }: SessionGroupProps) => {
  if (upcoming.length === 0 && past.length === 0) {
    return (
      <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Upcoming</h3>
          <div className="grid gap-3">
            {upcoming.map(s => (
              <SessionRow key={s.id} session={s} role={role} onAction={onAction} onReport={onReport} actionLoading={actionLoading} ratedSessionIds={ratedSessionIds} />
            ))}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Past</h3>
          <div className="grid gap-3 opacity-80">
            {past.map(s => (
              <SessionRow key={s.id} session={s} role={role} onAction={onAction} onReport={onReport} actionLoading={actionLoading} ratedSessionIds={ratedSessionIds} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Sessions = () => {
  const { user, refreshUser } = useAuth();
  const [learnerSessions, setLearnerSessions] = useState<Session[]>([]);
  const [mentorSessions, setMentorSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ratedSessionIds, setRatedSessionIds] = useState<string[]>([]);

  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [meetingLinkSession, setMeetingLinkSession] = useState<Session | null>(null);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    userId: string;
    userName: string;
    sessionId: string;
  } | null>(null);

  // NEW: which tab is active — persisted per-visit via URL-less local state
  const [activeTab, setActiveTab] = useState<"teaching" | "learning">("teaching");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      sessionsApi.getLearnerSessions(user.id).catch(() => []),
      sessionsApi.getMentorSessions(user.id).catch(() => [])
    ])
      .then(([ls, ms]) => {
        setLearnerSessions(ls);
        setMentorSessions(ms);
      })
      .catch((err: ApiError) => setError((err as Error).message ?? "Could not load sessions."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleMeetingLinkSaved = (sessionId: string, newLink: string) => {
    setMentorSessions(prev => prev.map(s => s.id === sessionId ? { ...s, meetingLink: newLink } : s));
    setLearnerSessions(prev => prev.map(s => s.id === sessionId ? { ...s, meetingLink: newLink } : s));
  };

  const handleAction = async (s: Session, action: "accept" | "reject" | "complete" | "feedback" | "cancel" | "link") => {
    if (action === "feedback") {
      setFeedbackSession(s);
      return;
    }

    if (action === "link") {
      setMeetingLinkSession(s);
      return;
    }

    if (action === "cancel") {
      if (!window.confirm("Are you sure you want to cancel this session?")) return;
    }

    setActionLoading(s.id);
    try {
      if (action === "accept") {
        await sessionsApi.updateStatus(s.id, "ACCEPTED");
        toast.success("Session accepted.");
      } else if (action === "reject") {
        await sessionsApi.updateStatus(s.id, "REJECTED");
        toast.success("Session rejected.");
      } else if (action === "complete") {
        await sessionsApi.complete(s.id);
        toast.success("Session marked as completed.");
      } else if (action === "cancel") {
        await sessionsApi.cancel(s.id);
        toast.success("Session cancelled.");
      }

      // Re-fetch to update state cleanly
      if (user?.id) {
        await refreshUser(user.id);
        const [ls, ms] = await Promise.all([
          sessionsApi.getLearnerSessions(user.id).catch(() => []),
          sessionsApi.getMentorSessions(user.id).catch(() => [])
        ]);
        setLearnerSessions(ls);
        setMentorSessions(ms);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReport = (s: Session) => {
    // Determine the counterparty based on current logged-in user
    const isLearner = s.learnerId === user?.id;
    const reportedUserId = isLearner ? s.mentorId : s.learnerId;
    const reportedUserName = isLearner ? s.mentorName : s.learnerName;

    setReportTarget({
      userId: reportedUserId,
      userName: reportedUserName,
      sessionId: s.id,
    });
    setReportModalOpen(true);
  };

  const onFeedbackSubmitted = (id: string) => {
    setRatedSessionIds(prev => [...prev, id]);
  };

  // FIX (Bug 5): the feedback dialog must name whichever side the CURRENT user is NOT —
  // previously this was hardcoded to feedbackSession.mentorName, which was wrong whenever
  // a mentor (rather than the learner) opened the dialog to rate their learner.
  const feedbackRateName = feedbackSession
    ? (feedbackSession.learnerId === user?.id ? feedbackSession.mentorName : feedbackSession.learnerName)
    : "";

  // Derived filtered lists
  const isPast = (st: string) => ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(st);
  const isUpcoming = (st: string) => ["PENDING", "ACCEPTED"].includes(st);

  const byStartAsc  = (a: Session, b: Session) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  const byStartDesc = (a: Session, b: Session) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime();

  const upcomingLearner = learnerSessions.filter(s => isUpcoming(s.status)).sort(byStartAsc);
  const pastLearner     = learnerSessions.filter(s => isPast(s.status)).sort(byStartDesc);

  const upcomingMentor = mentorSessions.filter(s => isUpcoming(s.status)).sort(byStartAsc);
  const pastMentor     = mentorSessions.filter(s => isPast(s.status)).sort(byStartDesc);

  // Badge counts for the tab triggers — pending items a mentor needs to act on, surfaced on the Teaching tab
  const pendingMentorCount = mentorSessions.filter(s => s.status === "PENDING").length;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Sessions</h1>
          <p className="text-muted-foreground text-sm">Manage your upcoming and past skill sessions.</p>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {loading ? (
          <div className="space-y-6"><SkeletonList count={3} /></div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "teaching" | "learning")}>
            <TabsList className="mb-8">
              <TabsTrigger value="teaching" className="gap-1.5">
                Teaching
                {pendingMentorCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                    {pendingMentorCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>

            <TabsContent value="teaching">
              <SessionGroup
                role="mentor"
                upcoming={upcomingMentor}
                past={pastMentor}
                emptyLabel="You have no teaching sessions."
                onAction={handleAction}
                onReport={handleReport}
                actionLoading={actionLoading}
                ratedSessionIds={ratedSessionIds}
              />
            </TabsContent>

            <TabsContent value="learning">
              <SessionGroup
                role="learner"
                upcoming={upcomingLearner}
                past={pastLearner}
                emptyLabel="You have no learning sessions."
                onAction={handleAction}
                onReport={handleReport}
                actionLoading={actionLoading}
                ratedSessionIds={ratedSessionIds}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <FeedbackDialog
        session={feedbackSession}
        rateName={feedbackRateName}
        onClose={() => setFeedbackSession(null)}
        onSubmitted={onFeedbackSubmitted}
      />

      <MeetingLinkDialog
        session={meetingLinkSession}
        onClose={() => setMeetingLinkSession(null)}
        onSaved={handleMeetingLinkSaved}
      />

      {/* Report User/Session Modal */}
      {reportTarget && (
        <ReportUserModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          reportedUserId={reportTarget.userId}
          reportedUserName={reportTarget.userName}
          sessionId={reportTarget.sessionId}
        />
      )}
    </AppLayout>
  );
};

export default Sessions;