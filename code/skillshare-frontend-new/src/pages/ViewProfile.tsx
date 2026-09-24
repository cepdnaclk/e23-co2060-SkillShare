import { useEffect, useState, ChangeEvent } from "react";
import { Clock, Star, Users2, Users, MessageSquare, Edit3, UserPlus, UserCheck, Clock4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useChat } from "@/context/ChatContext";
import { usersApi } from "@/api/users.api";
import { userSkillsApi } from "@/api/userSkills.api";
import { availabilityApi } from "@/api/availability.api";
import { sessionsApi } from "@/api/sessions.api";
import { connectionsApi } from "@/api/connections.api";
import { type User, type UserSkill, type Availability, type Session } from "@/api/types";
import { type ApiError } from "@/api/client";

import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SkeletonList } from "@/components/SkeletonCard";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: me, refreshUser } = useAuth();
  const { openChat, openWidget } = useChat();
  const preselectedSkillId = location.state?.skillId;

  const [mentor, setMentor] = useState<User | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [mentorGroupSessions, setMentorGroupSessions] = useState<Session[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; connectionId: string | null }>({ status: "NONE", connectionId: null });
  const [connLoading, setConnLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [sessionType, setSessionType] = useState<"INDIVIDUAL" | "GROUP">("INDIVIDUAL");
  const [groupCapacity, setGroupCapacity] = useState(2);
  const [booking, setBooking] = useState(false);

  // Upload pic state
  const [uploadingPic, setUploadingPic] = useState(false);

  const loadProfile = async () => {
    if (!id || id === "undefined") {
      setLoading(false);
      setError("Invalid profile user ID.");
      return;
    }

    setLoading(true);

    try {
      const [u, sk, av, statusData, allGroups] = await Promise.all([
        usersApi.getById(id),
        userSkillsApi.getByUser(id).catch(() => [] as UserSkill[]),
        availabilityApi.getMentorSlots(id).catch(() => [] as Availability[]),
        connectionsApi.getStatus(id).catch(() => ({ status: "NONE", connectionId: null })),
        sessionsApi.getGroups().catch(() => [] as Session[]),
      ]);
      setMentor(u as User);
      setSkills(sk as UserSkill[]);
      setSlots(av as Availability[]);
      setConnectionStatus(statusData as { status: string; connectionId: string | null });
      // Only this mentor's open (PENDING/ACCEPTED, upcoming) group sessions matter here.
      setMentorGroupSessions((allGroups as Session[]).filter(g => g.mentorId === id));
    } catch (err: unknown) {
      setError((err as ApiError as Error).message ?? "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  useEffect(() => {
    if (preselectedSkillId && skills.length > 0) {
      const matched = skills.find((s) => s.skillId === preselectedSkillId && s.skillType === "TEACH");
      if (matched) {
        setSelectedSkill(matched);
      }
    }
  }, [preselectedSkillId, skills]);

  const handleProfilePictureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mentor) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image file size must be less than 4MB");
      return;
    }
    setUploadingPic(true);
    try {
      const data = await usersApi.uploadProfilePicture(file);
      const updatedUrl = data.imageUrl;
      if (updatedUrl) {
        setMentor((prev) => prev ? { ...prev, profilePictureUrl: updatedUrl } : null);
        toast.success("Profile picture updated!");
      } else {
        const refreshedUser = await usersApi.getById(mentor.id);
        setMentor(refreshedUser);
        toast.success("Profile picture updated!");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to upload profile picture.");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleConnect = async () => {
    if (!id || connLoading) return;
    setConnLoading(true);
    try {
      const s = connectionStatus.status.toUpperCase();
      if (s === "NONE") {
        await connectionsApi.sendRequest(id);
        toast.success("Connection request sent.");
        const newStatus = await connectionsApi.getStatus(id);
        setConnectionStatus(newStatus);
      } else if (s === "PENDING_RECEIVED") {
        if (connectionStatus.connectionId) {
          await connectionsApi.acceptRequest(connectionStatus.connectionId);
          toast.success("Request accepted!");
          const newStatus = await connectionsApi.getStatus(id);
          setConnectionStatus(newStatus);
        }
      } else if (s === "FRIENDS" || s === "ACCEPTED") {
        toast.error("API Limitation: The backend currently lacks an endpoint to remove accepted friends.");
      } else if (s === "PENDING_SENT") {
        toast.error("API Limitation: The backend currently lacks an endpoint to cancel outgoing requests.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Connection action failed.");
    } finally {
      setConnLoading(false);
    }
  };

  const clampCapacity = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits === "") { setGroupCapacity(2); return; }
    setGroupCapacity(Math.min(5, Math.max(2, parseInt(digits, 10))));
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedSkill || !me?.id) return;
    setBooking(true);
    try {
      await sessionsApi.book(
        String(selectedSkill.skillId),
        String(selectedSlot.id),
        sessionType,
        sessionType === "GROUP" ? groupCapacity : undefined
      );
      toast.success(
        sessionType === "GROUP"
          ? "Group request sent! The mentor needs to accept the session and approve each learner, including you."
          : "Session booked! Waiting for confirmation."
      );
      refreshUser(me.id);
      setBookingOpen(false);
      setSessionType("INDIVIDUAL");
      setGroupCapacity(2);
      await loadProfile();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to book session.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-8">
          <SkeletonList count={1} />
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <SkeletonList count={2} />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!mentor) {
    return (
      <AppLayout>
        <div className="p-6 text-center pt-20">
          <ErrorBanner error={error ?? "Profile not found."} />
          <Button variant="outline" onClick={() => navigate("/search")} className="mt-4">
            Back to Explore
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isOwnProfile = me?.id === mentor.id;
  const teachSkills = skills.filter((s) => s.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.skillType === "LEARN");

  // Map each occupied slot to the group session sitting on it (if any), so a
  // slot reserved by a group request stays visible instead of disappearing.
  const groupSessionByAvailabilityId = new Map<string, Session>();
  mentorGroupSessions.forEach(g => {
    if (g.availabilityId) groupSessionByAvailabilityId.set(g.availabilityId, g);
  });

  const now = new Date();
  // Visible slots = open slots (bookable) + group-session slots (joinable),
  // sorted by time. Individually-booked slots (booked, no matching group)
  // stay hidden since those are someone else's private session.
  const visibleSlots = slots
    .filter((s) => new Date(s.startTime) > now)
    .filter((s) => !s.isBooked || groupSessionByAvailabilityId.has(s.id))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Connection button copy
  let connectLabel = "Connect";
  let ConnectIcon = UserPlus;
  const s = connectionStatus.status.toUpperCase();

  if (s === "PENDING_SENT" || s === "PENDING") {
    connectLabel = "Request Sent";
    ConnectIcon = Clock4;
  } else if (s === "PENDING_RECEIVED") {
    connectLabel = "Accept Request";
    ConnectIcon = UserCheck;
  } else if (s === "FRIENDS" || s === "ACCEPTED") {
    connectLabel = "Connected";
    ConnectIcon = UserCheck;
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col min-h-[calc(100vh-4rem)]">
        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-8" />

        {/* ── 1. PROFILE IDENTITY ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-8 mb-16">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold text-2xl sm:text-3xl overflow-hidden border-2 border-border/50">
              {mentor.profilePictureUrl ? (
                <img src={mentor.profilePictureUrl} alt={mentor.fullName} className="w-full h-full object-cover" />
              ) : (
                getInitials(mentor.fullName)
              )}
            </div>

            {isOwnProfile && (
              <label
                className={`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-secondary transition-colors ${uploadingPic ? 'opacity-50 pointer-events-none' : ''}`}
                title="Update picture"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
                <input type="file" accept="image/*" className="sr-only focus-visible:outline-none" onChange={handleProfilePictureUpload} disabled={uploadingPic} />
              </label>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
              {mentor.fullName}
            </h1>

            {mentor.bio && (
              <p className="text-muted-foreground text-sm max-w-xl mb-4 leading-relaxed">
                {mentor.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="w-4 h-4 fill-current opacity-70" /> {mentor.ratingAvg?.toFixed(1) ?? "New"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users2 className="w-4 h-4 opacity-70" /> {mentor.reputationScore ?? 0} rep
              </span>
            </div>

            {/* Profile Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" onClick={() => navigate("/create-profile", { state: { startStep: 1 } })}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    disabled={connLoading}
                    variant={connectionStatus.status === "ACCEPTED" ? "outline" : "default"}
                    onClick={handleConnect}
                    className="gap-2"
                  >
                    <ConnectIcon className="w-4 h-4" />
                    {connectLabel}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      if (!me?.id) return;
                      openChat({
                        contactId: mentor.id,
                        contactName: mentor.fullName,
                        contactProfilePicture: mentor.profilePictureUrl || null,
                        lastMessage: "",
                        lastMessageTime: null,
                        unreadCount: 0
                      });
                      openWidget();
                    }}
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </Button>

                  {teachSkills.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setBookingOpen(true)}
                    >
                      Request Session
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. SKILLS ───────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 mb-16">

          {/* TEACH */}
          <div>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
              Can Teach
            </h2>
            {teachSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teachSkills.map((s) => (
                  <Badge key={s.skillId} variant="secondary" className="px-3 py-1 text-xs font-medium bg-secondary/60 hover:bg-secondary">
                    {s.skillName}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed to teach.</p>
            )}
          </div>

          {/* LEARN */}
          <div>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
              Wants To Learn
            </h2>
            {learnSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {learnSkills.map((s) => (
                  <Badge key={s.skillId} variant="outline" className="px-3 py-1 text-xs font-medium border-border">
                    {s.skillName}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No learning goals listed.</p>
            )}
          </div>
        </div>

        {/* ── 3. AVAILABILITY ───────────────────────────────────────── */}
        {!isOwnProfile && teachSkills.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
              Upcoming Availability
            </h2>
            {visibleSlots.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {visibleSlots.slice(0, 6).map((slot) => {
                  const groupSession = groupSessionByAvailabilityId.get(slot.id);

                  if (groupSession) {
                    const capacity = groupSession.capacity ?? 5;
                    const joined = groupSession.participantCount ?? 0;
                    const isFull = joined >= capacity;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => navigate(`/sessions/group/${groupSession.id}`)}
                        className="p-3 border border-primary/30 bg-primary/5 rounded-xl text-sm flex flex-col gap-1.5 text-left hover:border-primary/50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {fmt(slot.startTime)}
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                            <Users className="w-3 h-3" /> Group
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {joined}/{capacity} joined
                          </span>
                        </span>
                        <span className="text-xs text-primary font-medium">
                          {isFull ? "View group (full)" : "View & request to join"}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div key={slot.id} className="p-3 border border-border/60 rounded-xl text-sm text-muted-foreground flex items-center justify-between group">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {fmt(slot.startTime)}
                      </span>
                      <button
                        className="text-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setBookingOpen(true);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming availability.</p>
            )}
          </div>
        )}

        {/* Booking Dialog */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Session</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Session type
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={sessionType === "INDIVIDUAL" ? "default" : "outline"}
                    onClick={() => setSessionType("INDIVIDUAL")}
                  >
                    Individual
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sessionType === "GROUP" ? "default" : "outline"}
                    onClick={() => setSessionType("GROUP")}
                  >
                    Group
                  </Button>
                </div>
                {sessionType === "GROUP" && (
                  <div className="pt-2 space-y-1.5">
                    <label className="text-sm text-muted-foreground" htmlFor="group-capacity">
                      Maximum learners (2–5)
                    </label>
                    <Input
                      id="group-capacity"
                      type="number"
                      min={2}
                      max={5}
                      value={groupCapacity}
                      onChange={e => clampCapacity(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The mentor must accept the session and approve each learner, including you, before it's confirmed.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Select a skill
                </label>
                {teachSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {teachSkills.map((s) => (
                      <button
                        key={s.skillId}
                        onClick={() => setSelectedSkill(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                          selectedSkill?.skillId === s.skillId
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-foreground border-border hover:border-foreground/30"
                        }`}
                      >
                        {s.skillName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">This user has no teachable skills.</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Select a time
                </label>
                {visibleSlots.filter(s => !groupSessionByAvailabilityId.has(s.id)).length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                    {visibleSlots
                      .filter(s => !groupSessionByAvailabilityId.has(s.id))
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSlot(s)}
                          className={`px-3 py-2 text-left rounded-lg text-sm transition-colors border ${
                            selectedSlot?.id === s.id
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-foreground border-border hover:border-foreground/30"
                          }`}
                        >
                          {fmt(s.startTime)}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No time slots available.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBook}
                disabled={
                  !selectedSkill || !selectedSlot || booking ||
                  (sessionType === "GROUP" && (groupCapacity < 2 || groupCapacity > 5))
                }
              >
                {booking ? "Confirming..." : "Confirm Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ViewProfile;