import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users, Calendar, Clock, Video, UserPlus, UserMinus, ArrowLeft,
  CheckCircle2, Clock3, XCircle, Share2, Sparkles, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import { sessionsApi } from "@/api/sessions.api";
import { connectionsApi } from "@/api/connections.api";
import { type Session, type ConnectionDto } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const GroupSessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [friends, setFriends] = useState<ConnectionDto[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [meetingLinkOpen, setMeetingLinkOpen] = useState(false);

  const fetchSession = async () => {
    if (!id) return;
    try {
      const data = await sessionsApi.getGroup(id);
      setSession(data);
      if (data.meetingLink) {
        setMeetingLinkInput(data.meetingLink);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to load group session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    connectionsApi.getFriends().then(setFriends).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">Group session not found.</p>
          <Button variant="outline" onClick={() => navigate("/sessions")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sessions
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isMentor = session.mentorId === user?.id;
  const myParticipant = session.participants?.find(p => p.userId === user?.id);
  const isJoined = myParticipant?.status === "JOINED";
  const isPending = myParticipant?.status === "PENDING";
  const isInvited = myParticipant?.status === "INVITED";
  const canInvite = isMentor || isJoined;

  const joinedParticipants = session.participants?.filter(p => p.status === "JOINED") ?? [];
  const pendingParticipants = session.participants?.filter(p => p.status === "PENDING") ?? [];
  const invitedParticipants = session.participants?.filter(p => p.status === "INVITED") ?? [];
  const declinedParticipants = session.participants?.filter(p => p.status === "DECLINED") ?? [];

  const joinedCount = joinedParticipants.length;
  const capacity = session.capacity ?? 5;
  const isFull = joinedCount >= capacity;

  const handleJoin = async () => {
    setBusy(true);
    try {
      await sessionsApi.joinGroup(session.id);
      toast.success("Request sent — awaiting mentor approval.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to send join request.");
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      await sessionsApi.declineGroup(session.id);
      toast.success("Invitation declined.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to decline invitation.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await sessionsApi.leaveGroup(session.id);
      toast.success("Left the group session.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to leave group session.");
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptParticipant = async (participantId: string) => {
    setBusy(true);
    try {
      await sessionsApi.acceptParticipant(session.id, participantId);
      toast.success("Learner approved into the group session.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to approve participant.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    setBusy(true);
    try {
      await sessionsApi.removeParticipant(session.id, participantId);
      toast.success("Participant removed.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to remove participant.");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedFriendId) return;
    setBusy(true);
    try {
      await sessionsApi.inviteParticipant(session.id, selectedFriendId);
      toast.success("Friend invited to group session!");
      setInviteOpen(false);
      setSelectedFriendId("");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to invite friend.");
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptSession = async () => {
    setBusy(true);
    try {
      await sessionsApi.updateStatus(session.id, "ACCEPTED");
      toast.success("Group session accepted! It can proceed with current joined learners.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to accept session.");
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    try {
      await sessionsApi.complete(session.id);
      toast.success("Group session marked completed. Credits have been settled.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to complete session.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await sessionsApi.cancel(session.id);
      toast.success("Group session cancelled.");
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to cancel session.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMeetingLink = async () => {
    if (!meetingLinkInput.trim()) return;
    setBusy(true);
    try {
      await sessionsApi.addMeetingLink(session.id, meetingLinkInput.trim());
      toast.success("Meeting link saved and participants notified!");
      setMeetingLinkOpen(false);
      await fetchSession();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to save meeting link.");
    } finally {
      setBusy(false);
    }
  };

  const availableFriends = friends.filter(friend => {
    const friendUser = friend.sender.id === user?.id ? friend.receiver : friend.sender;
    return !session.participants?.some(p => p.userId === friendUser.id);
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-8">

        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Sessions
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card to-secondary/30 border border-border">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-semibold uppercase text-xs">
                  Group Session
                </Badge>
                <Badge variant="secondary" className="font-semibold text-xs">
                  {session.status}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {session.skillName} Group Workshop
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> {formatDate(session.startTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end justify-center p-4 rounded-xl bg-card border border-border/80 min-w-[170px]">
              <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span>{joinedCount} / {capacity} Joined</span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (joinedCount / capacity) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {isFull ? "Group is full" : `${capacity - joinedCount} spot${capacity - joinedCount === 1 ? "" : "s"} open`}
              </p>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
            <Clock3 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Your request to join is awaiting mentor approval. You'll be notified once they respond.
            </p>
          </div>
        )}

        {session.status === "ACCEPTED" && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Meeting Link</p>
                {session.meetingLink ? (
<a      
            
                    href={session.meetingLink.startsWith("http") ? session.meetingLink : `https://${session.meetingLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline break-all font-mono"
                  >
                    {session.meetingLink}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">The mentor hasn't provided a video link yet.</p>
                )}
              </div>
            </div>
            {isMentor && (
              <Button size="sm" variant="outline" onClick={() => setMeetingLinkOpen(true)}>
                {session.meetingLink ? "Edit Link" : "Add Link"}
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-2 space-y-6">

            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Session Mentor
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {session.mentorProfilePictureUrl ? (
                      <img src={session.mentorProfilePictureUrl} alt={session.mentorName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(session.mentorName)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{session.mentorName}</p>
                    <p className="text-xs text-muted-foreground">Host & Instructor</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">Mentor</Badge>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Joined Learners ({joinedCount}/{capacity})
              </h2>

              {joinedParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No learners joined yet.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {joinedParticipants.map(participant => (
                    <div key={participant.userId} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center font-medium text-xs">
                          {participant.profilePictureUrl ? (
                            <img src={participant.profilePictureUrl} alt={participant.userName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(participant.userName)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {participant.userName} {participant.userId === user?.id && <span className="text-xs text-primary font-normal">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(participant.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          Joined
                        </Badge>
                        {isMentor && participant.userId !== user?.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleRemoveParticipant(participant.userId)}
                            disabled={busy}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pendingParticipants.length > 0 && (
              <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5" /> Awaiting Approval ({pendingParticipants.length})
                </h2>
                <div className="divide-y divide-amber-500/20">
                  {pendingParticipants.map(participant => (
                    <div key={participant.userId} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center font-medium text-xs">
                          {getInitials(participant.userName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {participant.userName} {participant.userId === user?.id && <span className="text-xs text-primary font-normal">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">Requested entry — awaiting mentor approval</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isMentor && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => handleAcceptParticipant(participant.userId)}
                              disabled={busy || isFull}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveParticipant(participant.userId)}
                              disabled={busy}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {!isMentor && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                            Awaiting Mentor
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitedParticipants.length > 0 && (
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Invited ({invitedParticipants.length})
                </h2>
                <div className="divide-y divide-border/60">
                  {invitedParticipants.map(participant => (
                    <div key={participant.userId} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center font-medium text-xs opacity-75">
                          {getInitials(participant.userName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {participant.userName} {participant.userId === user?.id && <span className="text-xs text-primary font-normal">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participant.invitedByUserName ? `Invited by ${participant.invitedByUserName}` : "Invited to join"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {participant.userId === user?.id ? (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleJoin}
                              disabled={busy || isFull}
                            >
                              Accept Invitation
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-500 hover:text-red-600"
                              onClick={handleDecline}
                              disabled={busy}
                            >
                              Decline
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Invited
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {declinedParticipants.length > 0 && (
              <div className="p-5 rounded-xl border border-border/60 bg-secondary/20 space-y-3 opacity-75">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-400" /> Declined ({declinedParticipants.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {declinedParticipants.map(p => (
                    <span key={p.userId} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-muted-foreground line-through">
                      {p.userName}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="space-y-6">

            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Your Actions</h2>

              {isInvited && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">You're invited. Accepting sends your request for mentor approval.</p>
                  <Button className="w-full" onClick={handleJoin} disabled={busy || isFull}>
                    Accept Invitation
                  </Button>
                  <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={handleDecline} disabled={busy}>
                    Decline Invitation
                  </Button>
                </div>
              )}

              {isPending && !isMentor && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Your request is awaiting mentor approval.</p>
                  <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={handleLeave} disabled={busy}>
                    Cancel Request
                  </Button>
                </div>
              )}

              {isJoined && !isMentor && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">You are a joined learner in this group workshop.</p>
                  {session.status !== "COMPLETED" && (
                    <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={handleLeave} disabled={busy}>
                      Leave Group
                    </Button>
                  )}
                </div>
              )}

              {!myParticipant && !isMentor && session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Request to join this study group.</p>
                  <Button className="w-full" onClick={handleJoin} disabled={busy || isFull}>
                    {isFull ? "Group is Full" : "Request to Join"}
                  </Button>
                </div>
              )}

              {isMentor && (
                <div className="space-y-2">
                  {session.status === "PENDING" && (
                    <>
                      <Button className="w-full" onClick={handleAcceptSession} disabled={busy}>
                        Accept Group Session
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Proceeds with 2-5 approved learners.
                      </p>
                      <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={handleCancel} disabled={busy}>
                        Cancel Session
                      </Button>
                    </>
                  )}
                  {session.status === "ACCEPTED" && (
                    <>
                      <Button className="w-full" onClick={handleComplete} disabled={busy}>
                        Mark as Completed
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Settles the group's 10-credit total among joined learners and pays you 10 credits.
                      </p>
                      <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={handleCancel} disabled={busy}>
                        Cancel Session
                      </Button>
                    </>
                  )}
                </div>
              )}

              {canInvite && session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={() => setInviteOpen(true)}
                    disabled={isFull}
                  >
                    <UserPlus className="w-4 h-4" /> Invite a Friend
                  </Button>
                  <p className="text-[11px] text-muted-foreground mt-1 text-center">
                    Mentors & joined learners can invite friends
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-secondary/30 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Group Guidelines
              </h2>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                <li>Group capacity is <strong className="text-foreground">2 to 5 learners</strong>.</li>
                <li>Joining or accepting an invite puts you in <strong className="text-foreground">pending</strong> status — the mentor must approve you before you're officially joined.</li>
                <li>No credits are charged for creating, inviting, accepting, approving, joining, or leaving.</li>
                <li>When the mentor marks the session completed, the group's flat <strong className="text-foreground">10-credit</strong> total is split evenly among joined learners, and the mentor receives <strong className="text-foreground">10 credits</strong>.</li>
              </ul>
            </div>

          </div>

        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Friend to Group</DialogTitle>
              <DialogDescription>
                Invite a connected friend to join this {session.skillName} study session.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {availableFriends.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No friends available to invite. Either all your friends are already in this group or you haven't connected with any friends yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Select a Friend</label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                  >
                    <option value="">Choose a friend...</option>
                    {availableFriends.map(friend => {
                      const friendUser = friend.sender.id === user?.id ? friend.receiver : friend.sender;
                      return (
                        <option key={friendUser.id} value={friendUser.id}>
                          {friendUser.fullName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!selectedFriendId || busy}>
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={meetingLinkOpen} onOpenChange={setMeetingLinkOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meeting Link</DialogTitle>
              <DialogDescription>
                Share a Google Meet, Zoom, or Teams video link for this group session.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <label className="text-xs font-medium text-foreground">Meeting URL</label>
              <Input
                placeholder="https://meet.google.com/..."
                value={meetingLinkInput}
                onChange={(e) => setMeetingLinkInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setMeetingLinkOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveMeetingLink} disabled={!meetingLinkInput.trim() || busy}>
                Save Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default GroupSessionDetail;