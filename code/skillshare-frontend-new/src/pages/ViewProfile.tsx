import { useEffect, useState, useRef, ChangeEvent } from "react";
import { Clock, Star, Trophy, Flame, Users, MessageSquare, Edit3, X, UserPlus, UserCheck, Clock4, GraduationCap, BookOpen, Flag, ShieldAlert, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useChat } from "@/context/ChatContext";
import { usersApi } from "@/api/users.api";
import { userSkillsApi } from "@/api/userSkills.api";
import { availabilityApi } from "@/api/availability.api";
import { sessionsApi } from "@/api/sessions.api";
import { connectionsApi } from "@/api/connections.api";
import { type UserPublicDto, type UserSkill, type Availability, type ConnectionDto } from "@/api/types";
import { type ApiError } from "@/api/client";
import { parseAcademicBio, formatAcademicBio } from "@/lib/academicBio";

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

// Import Report Modal
import { ReportUserModal } from "@/components/ReportUserModal";

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

  const [mentor, setMentor] = useState<UserPublicDto | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; connectionId: string | null }>({ status: "NONE", connectionId: null });
  const [connLoading, setConnLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current || !me?.id || !mentor || mentor.id !== me.id) return;
    
    try {
      const stored = localStorage.getItem(`skillshare_academic_${me.id}`);
      if (stored) {
        const local = JSON.parse(stored);
        if ((local.university || local.major) && (!mentor.bio || !mentor.bio.includes("[Academic:"))) {
          syncedRef.current = true;
          const clean = parseAcademicBio(mentor.bio).cleanBio;
          const formatted = formatAcademicBio(clean, local.university, local.major);
          usersApi.updateMyBio(formatted).then(() => {
            setMentor(prev => prev ? { ...prev, bio: formatted } : null);
          }).catch(() => {});
        }
      }
    } catch {
      // ignore JSON errors
    }
  }, [me?.id, mentor]);

  // Booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [booking, setBooking] = useState(false);

  // Upload pic state
  const [uploadingPic, setUploadingPic] = useState(false);

  // Friends modal state
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<ConnectionDto[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Confirmation dialog for removing a connected connection
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [connectionToRemove, setConnectionToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingConn, setRemovingConn] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const data = await connectionsApi.getFriends();
      setFriendsList(data);
    } catch {
      // ignore
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!connectionToRemove) return;
    setRemovingConn(true);
    try {
      try {
        await connectionsApi.deleteConnection(connectionToRemove.id);
      } catch {
        await connectionsApi.rejectRequest(connectionToRemove.id);
      }
      toast.success("Connection removed.");
      if (id) {
        const newStatus = await connectionsApi.getStatus(id);
        setConnectionStatus(newStatus);
      }
      setFriendsList((prev) => prev.filter((c) => c.id !== connectionToRemove.id));
      setConfirmRemoveOpen(false);
      setConnectionToRemove(null);
    } catch {
      toast.error("Failed to remove connection.");
    } finally {
      setRemovingConn(false);
    }
  };

  useEffect(() => {
    if (me?.id) {
      loadFriends();
    }
  }, [me?.id]);

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      setError("Invalid profile user ID.");
      return;
    }

    setLoading(true);

    Promise.all([
      usersApi.getById(id),
      userSkillsApi.getByUser(id).catch(() => [] as UserSkill[]),
      availabilityApi.getMentorSlots(id).catch(() => [] as Availability[]),
      connectionsApi.getStatus(id).catch(() => ({ status: "NONE", connectionId: null })),
    ])
      .then(([u, sk, av, statusData]) => {
        setMentor(u as UserPublicDto);
        setSkills(sk as UserSkill[]);
        setSlots(av as Availability[]);
        setConnectionStatus(statusData as { status: string; connectionId: string | null });
      })
      .catch((err: ApiError) => {
        setError((err as Error).message ?? "Could not load profile.");
      })
      .finally(() => setLoading(false));
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
        if (connectionStatus.connectionId) {
          setConnectionToRemove({
            id: connectionStatus.connectionId,
            name: mentor?.fullName ?? "",
          });
          setConfirmRemoveOpen(true);
        }
      } else if (s === "PENDING_SENT") {
        if (connectionStatus.connectionId) {
          try {
            await connectionsApi.deleteConnection(connectionStatus.connectionId);
          } catch {
            await connectionsApi.rejectRequest(connectionStatus.connectionId);
          }
          toast.success("Connection request cancelled.");
          const newStatus = await connectionsApi.getStatus(id);
          setConnectionStatus(newStatus);
        }
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Connection action failed.");
    } finally {
      setConnLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedSkill || !me?.id) return;
    setBooking(true);
    try {
      await sessionsApi.book(String(selectedSkill.skillId), String(selectedSlot.id));
      toast.success("Session booked! Waiting for confirmation.");
      refreshUser(me.id);
      setBookingOpen(false);
      if (id) {
        const av = await availabilityApi.getMentorSlots(id);
        setSlots(av);
      }
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

  // 🛑 DISABLE PROFILE VIEW IF USER IS SUSPENDED / INACTIVE
  if (mentor.isActive === false) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive mb-6 text-left">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-base font-bold">This user is no longer available</AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              This account has been suspended or deactivated. You cannot request sessions, send messages, or interact with this user.
            </AlertDescription>
          </Alert>

          <Card className="p-8 border-border/60 flex flex-col items-center">
            <div className="rounded-full bg-secondary p-4 mb-4">
              <CalendarX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">{mentor.fullName}</h2>
            <p className="text-sm text-muted-foreground mb-6">Account Suspended / Unavailable</p>
            <Button variant="outline" onClick={() => navigate("/search")}>
              Back to Explore
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isOwnProfile = me?.id === mentor.id;
  const teachSkills = skills.filter((s) => s.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.skillType === "LEARN");
  const unbookedSlots = slots.filter((s) => !s.isBooked);

  const academic = parseAcademicBio(mentor.bio);
  const localAcademic = (() => {
    try {
      const targetId = mentor?.id || id || (isOwnProfile && me?.id ? me.id : null);
      if (!targetId) return null;
      const stored = localStorage.getItem(`skillshare_academic_${targetId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const resolvedUniversity = academic.university || localAcademic?.university || "";
  const resolvedMajor = academic.major || localAcademic?.major || "";
  const academicInfoStr = [resolvedUniversity, resolvedMajor].filter(Boolean).join(" • ");
  const cleanBioText = academic.cleanBio;

  // Connection button copy
  let connectLabel = "Connect";
  let ConnectIcon = UserPlus;
  const s = connectionStatus.status.toUpperCase();
  
  if (s === "PENDING_SENT" || s === "PENDING") { 
    connectLabel = "Cancel Request"; 
    ConnectIcon = Clock4; 
  } else if (s === "PENDING_RECEIVED") {
    connectLabel = "Accept Request";
    ConnectIcon = UserCheck;
  } else if (s === "FRIENDS" || s === "ACCEPTED") { 
    connectLabel = "Remove Connection"; 
    ConnectIcon = X; 
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
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2 flex items-center gap-3">
              {mentor.fullName}
              {mentor.role === "ADMIN" && (
                <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-transparent px-2.5 py-0.5 text-xs font-semibold text-blue-500 shadow-sm" aria-label="Admin">
                  Admin
                </span>
              )}
            </h1>
            
            {cleanBioText && (
              <p className="text-muted-foreground text-sm max-w-xl mb-4 leading-relaxed">
                {cleanBioText}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {academicInfoStr ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <GraduationCap className="w-4 h-4 text-primary opacity-80" /> {academicInfoStr}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground/70">
                  <GraduationCap className="w-4 h-4 text-muted-foreground/50" /> Student
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground">
                  <Trophy className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden />
                  <span>LVL {mentor.level ?? 1}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground">
                  <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" aria-hidden />
                  <span>{mentor.xp ?? 0} XP</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground">
                  <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" aria-hidden />
                  <span>{mentor.reputationScore ?? 0} Rp</span>
                </div>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    loadFriends();
                    setFriendsOpen(true);
                  }}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 opacity-70" /> {friendsList.length} {friendsList.length === 1 ? "friend" : "friends"}
                </button>
              )}
            </div>

            {/* Profile Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadFriends();
                      setFriendsOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" /> All Friends ({friendsList.length})
                  </Button>
                </>
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

                  {/* 🚩 Report Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
                    title="Report user"
                  >
                    <Flag className="w-4 h-4" /> Report
                  </Button>
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
              <span className="text-[hsl(var(--teach-text))] font-semibold">Can Teach</span>
            </h2>
            {teachSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teachSkills.map((s) => (
                  <Badge key={s.skillId} variant="secondary" className="px-3 py-1 text-xs font-medium skill-badge-teach hover:opacity-80 transition-opacity">
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
              <span className="text-[hsl(var(--learn-text))] font-semibold">Wants To Learn</span>
            </h2>
            {learnSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {learnSkills.map((s) => (
                  <Badge key={s.skillId} variant="outline" className="px-3 py-1 text-xs font-medium skill-badge-learn hover:opacity-80 transition-opacity">
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
            {unbookedSlots.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {unbookedSlots.slice(0, 6).map((slot) => (
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
                ))}
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
                {unbookedSlots.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                    {unbookedSlots.map((s) => (
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
              <Button onClick={handleBook} disabled={!selectedSkill || !selectedSlot || booking}>
                {booking ? "Confirming..." : "Confirm Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* All Friends Dialog */}
        <Dialog open={friendsOpen} onOpenChange={setFriendsOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg w-full max-h-[85vh] flex flex-col p-5 sm:p-6 overflow-hidden">
            <DialogHeader className="shrink-0 pb-2 border-b border-border/50">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                All Friends ({friendsList.length})
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 py-3 pr-1 overscroll-contain">
              {loadingFriends ? (
                <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                  Loading connections...
                </div>
              ) : friendsList.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No connections yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Connect with other students and mentors on SkillShare to build your network.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {friendsList.map((conn) => {
                    const friend = conn.sender.id === me?.id ? conn.receiver : conn.sender;
                    return (
                      <div
                        key={conn.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-secondary/20 transition-colors gap-3 w-full"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 overflow-hidden"
                          onClick={() => {
                            setFriendsOpen(false);
                            navigate(`/profile/${friend.id}`);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground overflow-hidden shrink-0 border border-border/50">
                            {friend.profilePictureUrl ? (
                              <img src={friend.profilePictureUrl} alt={friend.fullName} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(friend.fullName)
                            )}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-foreground truncate hover:underline">
                              {friend.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              <span className="font-medium text-foreground/80">{friend.reputationScore ? `${friend.reputationScore} rep` : "0 rep"}</span>
                              {friend.bio ? ` • ${friend.bio}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs gap-1.5"
                            onClick={() => {
                              setFriendsOpen(false);
                              openChat({
                                contactId: friend.id,
                                contactName: friend.fullName,
                                contactProfilePicture: friend.profilePictureUrl || null,
                                lastMessage: "",
                                lastMessageTime: null,
                                unreadCount: 0
                              });
                              openWidget();
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove connection"
                            onClick={() => {
                              setConnectionToRemove({
                                id: conn.id,
                                name: friend.fullName,
                              });
                              setConfirmRemoveOpen(true);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-3 border-t border-border/50 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setFriendsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove Connection Confirmation Dialog */}
        <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Remove Connection?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-foreground">{connectionToRemove?.name}</span> from your connections? You will need to send a new request if you want to connect again.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmRemoveOpen(false);
                  setConnectionToRemove(null);
                }}
                disabled={removingConn}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmRemove}
                disabled={removingConn}
              >
                {removingConn ? "Removing..." : "Remove Connection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Modal */}
        {mentor && (
          <ReportUserModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            reportedUserId={mentor.id}
            reportedUserName={mentor.fullName}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default ViewProfile;