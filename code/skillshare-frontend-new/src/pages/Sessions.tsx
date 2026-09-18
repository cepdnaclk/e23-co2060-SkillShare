import { useEffect, useState } from "react";
import { Check, X, Clock, Calendar, Video, MessageSquare } from "lucide-react";
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
    } catch (err: any) {
      toast.error(err.message ?? "Feedback submitted.");
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

interface SessionRowProps {
  session: Session;
  role: "learner" | "mentor";
  onAction: (session: Session, action: "accept" | "reject" | "complete" | "feedback") => void;
  actionLoading: string | null;
  ratedSessionIds: string[];
}

const SessionRow = ({ session: s, role, onAction, actionLoading, ratedSessionIds }: SessionRowProps) => {
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
        {role === "learner" && s.meetingLink && s.status === "ACCEPTED" && (
          <div className="mt-2 text-xs flex items-center gap-2 bg-secondary/40 px-3 py-1.5 rounded-md w-fit">
            <Video className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono text-foreground select-all">{s.meetingLink}</span>
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
          <Button size="sm" variant="outline" onClick={() => onAction(s, "complete")} disabled={isBusy} className="h-8 text-xs">
            Mark Completed
          </Button>
        )}
        {role === "learner" && s.status === "COMPLETED" && !ratedSessionIds.includes(s.id) && (
          <Button size="sm" variant="secondary" onClick={() => onAction(s, "feedback")} disabled={isBusy} className="h-8 text-xs">
            Leave Feedback
          </Button>
        )}
      </div>
    </div>
  );
};

const Sessions = () => {
  const { user } = useAuth();
  const [learnerSessions, setLearnerSessions] = useState<Session[]>([]);
  const [mentorSessions, setMentorSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ratedSessionIds, setRatedSessionIds] = useState<string[]>([]);
  
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);

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
      .catch((err: ApiError) => setError(err.message ?? "Could not load sessions."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAction = async (s: Session, action: "accept" | "reject" | "complete" | "feedback") => {
    if (action === "feedback") {
      setFeedbackSession(s);
      return;
    }

    setActionLoading(s.id);
    try {
      if (action === "accept") {
        await sessionsApi.accept(s.id);
        toast.success("Session accepted.");
      } else if (action === "reject") {
        await sessionsApi.reject(s.id);
        toast.success("Session rejected.");
      } else if (action === "complete") {
        await sessionsApi.complete(s.id);
        toast.success("Session marked as completed.");
      }

      // Re-fetch to update state cleanly
      if (user?.id) {
        const ms = await sessionsApi.getMentorSessions(user.id);
        setMentorSessions(ms);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const onFeedbackSubmitted = (id: string) => {
    setRatedSessionIds(prev => [...prev, id]);
  };

  // Derived filtered lists
  const isPast = (st: string) => ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(st);
  const isUpcoming = (st: string) => ["PENDING", "ACCEPTED"].includes(st);

  const upcomingLearner = learnerSessions.filter(s => isUpcoming(s.status));
  const pastLearner = learnerSessions.filter(s => isPast(s.status));

  const upcomingMentor = mentorSessions.filter(s => isUpcoming(s.status));
  const pastMentor = mentorSessions.filter(s => isPast(s.status));

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Sessions</h1>
          <p className="text-muted-foreground text-sm">Manage your upcoming and past skill sessions.</p>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {loading ? (
          <div className="space-y-6"><SkeletonList count={3} /></div>
        ) : (
          <div className="space-y-12">
            
            {/* MENTOR SESSIONS */}
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">Teaching</h2>
              {upcomingMentor.length > 0 || pastMentor.length > 0 ? (
                <div className="space-y-8">
                  {upcomingMentor.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Upcoming</h3>
                      <div className="grid gap-3">
                        {upcomingMentor.map(s => (
                          <SessionRow key={s.id} session={s} role="mentor" onAction={handleAction} actionLoading={actionLoading} ratedSessionIds={ratedSessionIds} />
                        ))}
                      </div>
                    </div>
                  )}
                  {pastMentor.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Past</h3>
                      <div className="grid gap-3 opacity-80">
                        {pastMentor.map(s => (
                          <SessionRow key={s.id} session={s} role="mentor" onAction={handleAction} actionLoading={actionLoading} ratedSessionIds={ratedSessionIds} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">You have no teaching sessions.</p>
              )}
            </section>

            {/* LEARNER SESSIONS */}
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">Learning</h2>
              {upcomingLearner.length > 0 || pastLearner.length > 0 ? (
                <div className="space-y-8">
                  {upcomingLearner.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Upcoming</h3>
                      <div className="grid gap-3">
                        {upcomingLearner.map(s => (
                          <SessionRow key={s.id} session={s} role="learner" onAction={handleAction} actionLoading={actionLoading} ratedSessionIds={ratedSessionIds} />
                        ))}
                      </div>
                    </div>
                  )}
                  {pastLearner.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Past</h3>
                      <div className="grid gap-3 opacity-80">
                        {pastLearner.map(s => (
                          <SessionRow key={s.id} session={s} role="learner" onAction={handleAction} actionLoading={actionLoading} ratedSessionIds={ratedSessionIds} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">You have no learning sessions.</p>
              )}
            </section>

          </div>
        )}
      </div>

      <FeedbackDialog
        session={feedbackSession}
        rateName={feedbackSession ? feedbackSession.mentorName : ""}
        onClose={() => setFeedbackSession(null)}
        onSubmitted={onFeedbackSubmitted}
      />
    </AppLayout>
  );
};

export default Sessions;