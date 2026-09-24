import { useEffect, useState } from "react";
import { Clock, Calendar, Video, Users, UserMinus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { sessionsApi } from "@/api/sessions.api";
import { feedbackApi } from "@/api/feedback.api";
import { connectionsApi } from "@/api/connections.api";
import { type Session, type FeedbackTagDto, type ConnectionDto } from "@/api/types";
import { type ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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
          <DialogDescription>How was your session with {rateName}? Select applicable traits.</DialogDescription>
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
                    isSel ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:border-foreground/30"
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
  const counterpartName = (role === "learner" ? s.mentorName : s.learnerName) ?? "Unknown user";

  const statusColor: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    ACCEPTED: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    COMPLETED: "text-muted-foreground bg-secondary border-border",
    CANCELLED: "text-red-500 bg-red-500/10 border-red-500/20",
    REJECTED: "text-red-500 bg-red-500/10 border-red-500/20",
    EXPIRED: "text-muted-foreground bg-secondary border-border",
  };
  const badgeClass = statusColor[s.status] ?? "text-muted-foreground bg-secondary";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border/70 rounded-2xl bg-card hover:border-border transition-all gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="font-semibold text-foreground truncate text-base">{s.skillName}</span>
          <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>{s.status}</span>
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{role === "learner" ? "Mentor:" : "Student:"} <strong className="text-foreground font-medium">{counterpartName}</strong></span>
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
            <Button size="sm" variant="outline" onClick={() => onAction(s, "reject")} disabled={isBusy} className="h-8 text-xs text-red-500 hover:text-red-600">Reject</Button>
            <Button size="sm" onClick={() => onAction(s, "accept")} disabled={isBusy} className="h-8 text-xs">Accept</Button>
          </>
        )}
        {role === "mentor" && s.status === "ACCEPTED" && (
          <Button size="sm" variant="outline" onClick={() => onAction(s, "complete")} disabled={isBusy} className="h-8 text-xs">Mark Completed</Button>
        )}
        {role === "learner" && s.status === "COMPLETED" && !ratedSessionIds.includes(s.id) && (
          <Button size="sm" variant="secondary" onClick={() => onAction(s, "feedback")} disabled={isBusy} className="h-8 text-xs">Leave Feedback</Button>
        )}
      </div>
    </div>
  );
};

interface GroupSessionCardProps {
  session: Session;
  userId?: string;
  busy: boolean;
  friends: ConnectionDto[];
  onJoin: () => void;
  onDecline: () => void;
  onLeave: () => void;
  onRemove: (userId: string) => void;
  onCancel: () => void;
  onInvite: (userId: string) => void;
  onComplete: () => void;
  onAcceptSession: () => void;
  onAcceptParticipant: (userId: string) => void;
  onFeedback: () => void;
}

const GroupSessionCard = ({
  session, userId, busy, friends,
  onJoin, onDecline, onLeave, onRemove, onCancel, onInvite, onComplete, onAcceptSession, onAcceptParticipant, onFeedback
}: GroupSessionCardProps) => {
  const navigate = useNavigate();
  const isMentor = session.mentorId === userId;
  const myParticipant = session.participants?.find(p => p.userId === userId);
  const isJoined = myParticipant?.status === "JOINED";
  const isInvited = myParticipant?.status === "INVITED";
  const isPendingMe = myParticipant?.status === "PENDING";
  const isOrganizer = session.learnerId === userId;
  const canInvite = isMentor || isOrganizer || isJoined;

  const joinedParticipants = session.participants?.filter(p => p.status === "JOINED") ?? [];
  const pendingParticipants = session.participants?.filter(p => p.status === "PENDING") ?? [];
  const invitedParticipants = session.participants?.filter(p => p.status === "INVITED") ?? [];
  const declinedParticipants = session.participants?.filter(p => p.status === "DECLINED") ?? [];

  const joinedCount = joinedParticipants.length;
  const capacity = session.capacity ?? 5;
  const isFull = joinedCount >= capacity;

  const availableFriends = friends.filter(friend => {
    const friendUser = friend.sender.id === userId ? friend.receiver : friend.sender;
    return !session.participants?.some(p => p.userId === friendUser.id);
  });

  return (
    <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-lg text-foreground">{session.skillName} Group</span>
            <Badge variant="secondary" className="text-[10px] font-semibold uppercase">{session.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Mentor: <strong className="text-foreground">{session.mentorName}</strong></span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(session.startTime)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(session.startTime)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/60 text-xs font-semibold">
          <Users className="w-4 h-4 text-primary" /><span>{joinedCount} / {capacity} joined</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/40 space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Members &amp; invites</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
            <Shield className="w-3 h-3" /> {session.mentorName} (Mentor)
          </span>
          {joinedParticipants.map(p => (
            <span key={p.userId} className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
              {p.userName} {p.userId === userId && "(You)"}
              {isMentor && p.userId !== userId && (
                <button aria-label={`Remove ${p.userName}`} disabled={busy} onClick={() => onRemove(p.userId)} className="ml-1 text-muted-foreground hover:text-red-500">
                  <UserMinus className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {pendingParticipants.map(p => (
            <span key={p.userId} className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
              {p.userName} (Pending Mentor Approval)
              {isMentor && (
                <button aria-label={`Approve ${p.userName}`} disabled={busy || isFull} onClick={() => onAcceptParticipant(p.userId)} className="ml-1 text-xs font-semibold text-primary underline">
                  Approve
                </button>
              )}
            </span>
          ))}
          {invitedParticipants.map(p => (
            <span key={p.userId} className="text-xs bg-secondary text-muted-foreground border border-border px-2.5 py-1 rounded-md">
              {p.userName} (Invited{p.invitedByUserName ? ` by ${p.invitedByUserName}` : ""})
            </span>
          ))}
          {declinedParticipants.map(p => (
            <span key={p.userId} className="text-xs bg-secondary/50 text-muted-foreground line-through px-2 py-0.5 rounded-md">
              {p.userName} (Declined)
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate(`/sessions/group/${session.id}`)}>
          View details
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {isInvited && (
            <>
              <Button size="sm" className="h-8 text-xs" disabled={busy || isFull} onClick={onJoin}>Accept Invitation</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:text-red-600" disabled={busy} onClick={onDecline}>Decline</Button>
            </>
          )}
          {isPendingMe && <span className="text-xs text-amber-600 font-medium px-2">Pending Mentor Approval</span>}
          {(isJoined || isPendingMe) && !isMentor && session.status !== "COMPLETED" && (
            <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:text-red-600" disabled={busy} onClick={onLeave}>
              {isJoined ? "Leave group" : "Cancel request"}
            </Button>
          )}
          {isMentor && session.status === "PENDING" && (
            <>
              <Button size="sm" className="h-8 text-xs" disabled={busy} onClick={onAcceptSession}>Accept session</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:text-red-600" disabled={busy} onClick={onCancel}>Cancel</Button>
            </>
          )}
          {isMentor && session.status === "ACCEPTED" && (
            <Button size="sm" variant="outline" className="h-8 text-xs" disabled={busy} onClick={onComplete}>Mark completed</Button>
          )}
          {!myParticipant && !isMentor && session.status === "PENDING" && (
            <Button size="sm" className="h-8 text-xs" disabled={busy || isFull} onClick={onJoin}>
              {isFull ? "Full" : "Request to join"}
            </Button>
          )}
          {canInvite && session.status === "PENDING" && availableFriends.length > 0 && !isFull && (
            <select
              aria-label="Invite a friend"
              className="h-8 rounded-md border bg-background px-2 text-xs"
              defaultValue=""
              disabled={busy}
              onChange={e => { if (e.target.value) { onInvite(e.target.value); e.currentTarget.value = ""; } }}
            >
              <option value="">+ Invite friend…</option>
              {availableFriends.map(friend => {
                const friendUser = friend.sender.id === userId ? friend.receiver : friend.sender;
                return <option key={friendUser.id} value={friendUser.id}>{friendUser.fullName}</option>;
              })}
            </select>
          )}
          {session.status === "COMPLETED" && isJoined && !isMentor && (
            <Button size="sm" variant="secondary" className="h-8 text-xs" disabled={busy} onClick={onFeedback}>Leave feedback</Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Sessions = () => {
  const { user } = useAuth();
  const [learnerSessions, setLearnerSessions] = useState<Session[]>([]);
  const [mentorSessions, setMentorSessions] = useState<Session[]>([]);
  const [myGroupSessions, setMyGroupSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ratedSessionIds, setRatedSessionIds] = useState<string[]>([]);
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [groupBusy, setGroupBusy] = useState<string | null>(null);
  const [friends, setFriends] = useState<ConnectionDto[]>([]);

  const [activeTab, setActiveTab] = useState<"learning" | "teaching">("learning");
  const [learningSubTab, setLearningSubTab] = useState<"all" | "individual" | "group">("all");
  const [teachingSubTab, setTeachingSubTab] = useState<"all" | "individual" | "group">("all");

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [ls, ms, mine, connectedFriends] = await Promise.all([
        sessionsApi.getLearnerSessions(user.id).catch(() => []),
        sessionsApi.getMentorSessions(user.id).catch(() => []),
        sessionsApi.getMyGroups().catch(() => []),
        connectionsApi.getFriends().catch(() => []),
      ]);
      setLearnerSessions(ls);
      setMentorSessions(ms);
      setMyGroupSessions(mine);
      setFriends(connectedFriends);
    } catch (err) {
      setError((err as ApiError as Error).message ?? "Could not load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [user?.id]);

  const refreshGroups = () =>
    sessionsApi.getMyGroups().then(setMyGroupSessions).catch(() => {});

  const refreshMentorTeaching = () =>
    user?.id ? sessionsApi.getMentorSessions(user.id).then(setMentorSessions).catch(() => {}) : Promise.resolve();

  const groupAction = async (
    sessionId: string,
    action: "join" | "decline" | "leave" | "cancel" | "remove" | "invite" | "complete" | "accept" | "accept-participant",
    participantId?: string
  ) => {
    setGroupBusy(sessionId);
    try {
      if (action === "join") { await sessionsApi.joinGroup(sessionId); toast.success("Request sent — awaiting mentor approval."); }
      else if (action === "decline") { await sessionsApi.declineGroup(sessionId); toast.success("Invitation declined."); }
      else if (action === "leave") { await sessionsApi.leaveGroup(sessionId); toast.success("Left the group session."); }
      else if (action === "cancel") { await sessionsApi.cancel(sessionId); toast.success("Group session cancelled."); }
      else if (action === "complete") { await sessionsApi.complete(sessionId); toast.success("Group session marked completed."); }
      else if (action === "accept") { await sessionsApi.updateStatus(sessionId, "ACCEPTED"); toast.success("Group session accepted."); }
      else if (action === "accept-participant" && participantId) { await sessionsApi.acceptParticipant(sessionId, participantId); toast.success("Learner approved into the group."); }
      else if (action === "invite" && participantId) { await sessionsApi.inviteParticipant(sessionId, participantId); toast.success("Friend invited."); }
      else if (participantId) { await sessionsApi.removeParticipant(sessionId, participantId); toast.success("Participant removed."); }
      await Promise.all([refreshGroups(), refreshMentorTeaching()]);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Group action failed.");
    } finally {
      setGroupBusy(null);
    }
  };

  const handleAction = async (s: Session, action: "accept" | "reject" | "complete" | "feedback") => {
    if (action === "feedback") { setFeedbackSession(s); return; }
    setActionLoading(s.id);
    try {
      if (action === "accept") { await sessionsApi.updateStatus(s.id, "ACCEPTED"); toast.success("Session accepted."); }
      else if (action === "reject") { await sessionsApi.updateStatus(s.id, "REJECTED"); toast.success("Session rejected."); }
      else if (action === "complete") { await sessionsApi.complete(s.id); toast.success("Session marked as completed."); }
      if (user?.id) setMentorSessions(await sessionsApi.getMentorSessions(user.id));
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const onFeedbackSubmitted = (id: string) => setRatedSessionIds(prev => [...prev, id]);

  const isPast = (st: string) => ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(st);
  const isUpcoming = (st: string) => ["PENDING", "ACCEPTED"].includes(st);
  const byStartAsc = (a: Session, b: Session) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  const byStartDesc = (a: Session, b: Session) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime();

  // Strict separation: individual endpoints only ever hold INDIVIDUAL, and we
  // additionally filter defensively; group data only ever comes from myGroupSessions.
  const teachingIndividual = mentorSessions.filter(s => s.sessionType === "INDIVIDUAL");
  const teachingGroups = mentorSessions.filter(s => s.sessionType === "GROUP");

  const learningIndividual = learnerSessions.filter(s => s.sessionType === "INDIVIDUAL");
  const learningGroups = myGroupSessions.filter(g => g.mentorId !== user?.id);

  const upcomingTeachingIndividual = teachingIndividual.filter(s => isUpcoming(s.status)).sort(byStartAsc);
  const pastTeachingIndividual = teachingIndividual.filter(s => isPast(s.status)).sort(byStartDesc);
  const upcomingLearningIndividual = learningIndividual.filter(s => isUpcoming(s.status)).sort(byStartAsc);
  const pastLearningIndividual = learningIndividual.filter(s => isPast(s.status)).sort(byStartDesc);

  const totalTeachingIndividual = upcomingTeachingIndividual.length + pastTeachingIndividual.length;
  const totalTeachingGroups = teachingGroups.length;
  const totalTeaching = totalTeachingIndividual + totalTeachingGroups;

  const totalLearningIndividual = upcomingLearningIndividual.length + pastLearningIndividual.length;
  const totalLearningGroups = learningGroups.length;
  const totalLearning = totalLearningIndividual + totalLearningGroups;

  const groupCardProps = (s: Session) => ({
    key: s.id,
    session: s,
    userId: user?.id,
    busy: groupBusy === s.id,
    friends,
    onJoin: () => groupAction(s.id, "join"),
    onDecline: () => groupAction(s.id, "decline"),
    onLeave: () => groupAction(s.id, "leave"),
    onCancel: () => groupAction(s.id, "cancel"),
    onComplete: () => groupAction(s.id, "complete"),
    onAcceptSession: () => groupAction(s.id, "accept"),
    onAcceptParticipant: (participantId: string) => groupAction(s.id, "accept-participant", participantId),
    onFeedback: () => setFeedbackSession(s),
    onRemove: (participantId: string) => groupAction(s.id, "remove", participantId),
    onInvite: (participantId: string) => groupAction(s.id, "invite", participantId),
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Sessions</h1>
          <p className="text-muted-foreground text-sm">Manage your learning and teaching sessions.</p>
        </div>

        {/* Primary Navigation: Learning vs Teaching */}
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-px">
          <Button
            variant={activeTab === "learning" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("learning")}
            className="rounded-b-none text-xs sm:text-sm font-medium gap-2"
          >
            Learning
            <Badge variant={activeTab === "learning" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
              {totalLearning}
            </Badge>
          </Button>
          <Button
            variant={activeTab === "teaching" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("teaching")}
            className="rounded-b-none text-xs sm:text-sm font-medium gap-2"
          >
            Teaching
            <Badge variant={activeTab === "teaching" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
              {totalTeaching}
            </Badge>
          </Button>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {loading ? (
          <div className="space-y-6"><SkeletonList count={3} /></div>
        ) : activeTab === "learning" ? (
          /* ══════════════════════════════════════════════════════════
             LEARNING SECTION: Strictly Separated Individual vs Group
             ══════════════════════════════════════════════════════════ */
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={learningSubTab === "all" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setLearningSubTab("all")}
                  className="text-xs h-8"
                >
                  All ({totalLearning})
                </Button>
                <Button
                  variant={learningSubTab === "individual" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setLearningSubTab("individual")}
                  className="text-xs h-8"
                >
                  Individual Sessions ({totalLearningIndividual})
                </Button>
                <Button
                  variant={learningSubTab === "group" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setLearningSubTab("group")}
                  className="text-xs h-8"
                >
                  Group Sessions ({totalLearningGroups})
                </Button>
              </div>
            </div>

            {/* Individual Learning Sessions Container */}
            {(learningSubTab === "all" || learningSubTab === "individual") && (
              <div className="space-y-4 p-5 rounded-2xl border border-border/80 bg-card/50">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Individual Learning Sessions (1-on-1)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Private 1-on-1 sessions where you are the learner.
                  </p>
                </div>

                {upcomingLearningIndividual.length > 0 || pastLearningIndividual.length > 0 ? (
                  <div className="space-y-6 pt-2">
                    {upcomingLearningIndividual.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
                        <div className="grid gap-3">
                          {upcomingLearningIndividual.map(s => (
                            <SessionRow
                              key={s.id}
                              session={s}
                              role="learner"
                              onAction={handleAction}
                              actionLoading={actionLoading}
                              ratedSessionIds={ratedSessionIds}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {pastLearningIndividual.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past</h3>
                        <div className="grid gap-3 opacity-80">
                          {pastLearningIndividual.map(s => (
                            <SessionRow
                              key={s.id}
                              session={s}
                              role="learner"
                              onAction={handleAction}
                              actionLoading={actionLoading}
                              ratedSessionIds={ratedSessionIds}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">
                    No individual learning sessions.
                  </p>
                )}
              </div>
            )}

            {/* Group Learning Sessions Container */}
            {(learningSubTab === "all" || learningSubTab === "group") && (
              <div className="space-y-4 p-5 rounded-2xl border border-border/80 bg-card/50">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Group Learning Sessions (Cohorts 2–5)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Group workshops where you are an invited, pending, or joined learner.
                  </p>
                </div>

                {learningGroups.length > 0 ? (
                  <div className="grid gap-4 pt-2">
                    {learningGroups.map(s => (
                      <GroupSessionCard {...groupCardProps(s)} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">
                    No group learning sessions yet. Visit a mentor's profile and choose "Group" when requesting a session, or accept an invitation to join one!
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════
             TEACHING SECTION: Strictly Separated Individual vs Group
             ══════════════════════════════════════════════════════════ */
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={teachingSubTab === "all" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTeachingSubTab("all")}
                  className="text-xs h-8"
                >
                  All ({totalTeaching})
                </Button>
                <Button
                  variant={teachingSubTab === "individual" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTeachingSubTab("individual")}
                  className="text-xs h-8"
                >
                  Individual Sessions ({totalTeachingIndividual})
                </Button>
                <Button
                  variant={teachingSubTab === "group" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTeachingSubTab("group")}
                  className="text-xs h-8"
                >
                  Group Sessions ({totalTeachingGroups})
                </Button>
              </div>
            </div>

            {/* Individual Teaching Sessions Container */}
            {(teachingSubTab === "all" || teachingSubTab === "individual") && (
              <div className="space-y-4 p-5 rounded-2xl border border-border/80 bg-card/50">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Individual Teaching Sessions (1-on-1)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Private 1-on-1 sessions where you are the mentor.
                  </p>
                </div>

                {upcomingTeachingIndividual.length > 0 || pastTeachingIndividual.length > 0 ? (
                  <div className="space-y-6 pt-2">
                    {upcomingTeachingIndividual.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
                        <div className="grid gap-3">
                          {upcomingTeachingIndividual.map(s => (
                            <SessionRow
                              key={s.id}
                              session={s}
                              role="mentor"
                              onAction={handleAction}
                              actionLoading={actionLoading}
                              ratedSessionIds={ratedSessionIds}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {pastTeachingIndividual.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past</h3>
                        <div className="grid gap-3 opacity-80">
                          {pastTeachingIndividual.map(s => (
                            <SessionRow
                              key={s.id}
                              session={s}
                              role="mentor"
                              onAction={handleAction}
                              actionLoading={actionLoading}
                              ratedSessionIds={ratedSessionIds}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">
                    No individual teaching sessions.
                  </p>
                )}
              </div>
            )}

            {/* Group Teaching Sessions Container */}
            {(teachingSubTab === "all" || teachingSubTab === "group") && (
              <div className="space-y-4 p-5 rounded-2xl border border-border/80 bg-card/50">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Group Teaching Sessions (Cohorts 2–5)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Group workshops that you host and lead as the mentor.
                  </p>
                </div>

                {teachingGroups.length > 0 ? (
                  <div className="grid gap-4 pt-2">
                    {teachingGroups.map(s => (
                      <GroupSessionCard {...groupCardProps(s)} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">
                    You aren't hosting any group sessions yet. A learner can request one from your availability, or you can offer group availability on your profile.
                  </p>
                )}
              </div>
            )}
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