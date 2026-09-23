import { useEffect, useState, ChangeEvent } from "react";
import { Clock, Star, Users2, Users, MessageSquare, Edit3, X, UserPlus, UserCheck, Clock4, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useChat } from "@/context/ChatContext";
import { usersApi } from "@/api/users.api";
import { userSkillsApi } from "@/api/userSkills.api";
import { availabilityApi } from "@/api/availability.api";
import { sessionsApi } from "@/api/sessions.api";
import { connectionsApi } from "@/api/connections.api";
import { type UserPublicDto, type UserSkill, type Availability } from "@/api/types";
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

  const [mentor, setMentor] = useState<UserPublicDto | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; connectionId: string | null }>({ status: "NONE", connectionId: null });
  const [connLoading, setConnLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [booking, setBooking] = useState(false);

  // Upload pic state
  const [uploadingPic, setUploadingPic] = useState(false);

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
          // If they click "Accept" (wait, ViewProfile only has one Connect button!)
          // Let's accept it.
          await connectionsApi.acceptRequest(connectionStatus.connectionId);
          toast.success("Request accepted!");
          const newStatus = await connectionsApi.getStatus(id);
          setConnectionStatus(newStatus);
        }
      } else if (s === "FRIENDS" || s === "ACCEPTED") {
        if (connectionStatus.connectionId) {
          try {
            await connectionsApi.deleteConnection(connectionStatus.connectionId);
          } catch {
            await connectionsApi.rejectRequest(connectionStatus.connectionId);
          }
          toast.success("Connection removed.");
          const newStatus = await connectionsApi.getStatus(id);
          setConnectionStatus(newStatus);
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

  const isOwnProfile = me?.id === mentor.id;
  const teachSkills = skills.filter((s) => s.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.skillType === "LEARN");
  const unbookedSlots = slots.filter((s) => !s.isBooked);

  const academic = (() => {
    try {
      const stored = localStorage.getItem(`skillshare_academic_${mentor.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();
  const academicInfoStr = [academic?.university, academic?.major].filter(Boolean).join(" • ");

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
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
              {mentor.fullName}
            </h1>
            
            {mentor.bio && (
              <p className="text-muted-foreground text-sm max-w-xl mb-4 leading-relaxed">
                {mentor.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {academicInfoStr && (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <GraduationCap className="w-4 h-4 text-primary opacity-80" /> {academicInfoStr}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users2 className="w-4 h-4 opacity-70" /> {mentor.reputationScore ?? 0} rep
              </span>
            </div>

            {/* Profile Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
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
      </div>
    </AppLayout>
  );
};

export default ViewProfile;
