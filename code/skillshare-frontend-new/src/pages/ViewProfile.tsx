import { useEffect, useState, ChangeEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Star,
  BookOpen,
  Coins,
  ChevronRight,
  Edit3,
  GraduationCap,
  X,
  ChevronLeft,
  Zap,
  Users,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useChat } from "@/context/ChatContext";
import {
  usersApi,
  userSkillsApi,
  availabilityApi,
  sessionsApi,
  type User,
  type UserSkill,
  type Availability,
  type ApiError,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

interface ConnectionUserDto {
  id: string;
  fullName: string;
  bio?: string;
  profilePictureUrl?: string;
  xp: number;
  level: number;
  reputationScore: number;
}

interface ConnectionDto {
  id: string;
  status: string;
  sender: ConnectionUserDto;
  receiver: ConnectionUserDto;
}

const connectionsApi = {
  getFriends: async (): Promise<ConnectionDto[]> => {
    const res = await fetch("/api/connections/friends", {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to load friend connections.");
    return res.json();
  }
};

const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me, refreshUser } = useAuth();
  const { openWidget, openChat } = useChat();
  const location = useLocation();
  const preselectedSkillId = location.state?.skillId;

  const [mentor, setMentor] = useState<User | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [friends, setFriends] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [booking, setBooking] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null);

  // File Upload State Control
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
      connectionsApi.getFriends().catch(() => [] as ConnectionDto[]),
    ])
        .then(([u, sk, av, fr]) => {
          setMentor(u);
          setSkills(sk);
          setSlots(av);
          setFriends(fr);
        })
        .catch((err: ApiError) => {
          setError(err.message ?? "Could not load profile dashboard.");
        })
        .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (preselectedSkillId && skills.length > 0) {
      const matched = skills.find(
          (s) =>
              s.skillId === preselectedSkillId && s.skillType === "TEACH",
      );

      if (matched) {
        setSelectedSkill(matched);
      }
    }
  }, [preselectedSkillId, skills]);

  const handleProfilePictureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mentor) return;

    // Fast local file size check (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image file size must be less than 4MB");
      return;
    }

    setUploadingPic(true);
    try {
      // 1. Invoke your centralized API service method
      const data = await usersApi.uploadProfilePicture(file);

      // 2. Extract imageUrl from ProfilePictureResponse interface definitions
      const updatedUrl = data.imageUrl;

      if (updatedUrl) {
        setMentor((prev) => prev ? { ...prev, profilePictureUrl: updatedUrl } : null);
        toast.success("Profile picture updated successfully!");
      } else {
        // Fallback re-fetch just in case
        const refreshedUser = await usersApi.getById(mentor.id);
        setMentor(refreshedUser);
        toast.success("Profile picture updated!");
      }
    } catch (err) {
      console.error("Upload error context:", err);
      toast.error(err.message || "Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleDeleteSkill = async (us: UserSkill) => {
    const key = `${us.skillId}-${us.skillType}`;
    if (deletingSkill === key) return;
    setDeletingSkill(key);
    try {
      await userSkillsApi.remove(String(us.skillId), us.skillType);
      setSkills((prev) =>
          prev.filter(
              (s) =>
                  !(
                      s.skillId === us.skillId &&
                      s.skillType === us.skillType
                  ),
          ),
      );
      toast.success(`"${us.skillName}" removed.`);
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to remove skill.");
    } finally {
      setDeletingSkill(null);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedSkill || !me?.id) return;
    setBooking(true);
    try {
      await sessionsApi.book(String(selectedSkill.skillId), String(selectedSlot.id));
      toast.success("Session booked! Waiting for confirmation.");
      refreshUser(me.id); // Deduct credits instantly in UI
      setBookingOpen(false);
      if (id)
        availabilityApi
            .getMentorSlots(id)
            .then((av) => setSlots(av));
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const getInitials = (name: string) =>
      name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const renderRealCalendarDays = () => {
    const dayCells = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      dayCells.push(<div key={`empty-${i}`} className="h-6 w-6 text-transparent" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);

      const matchedSlots = slots.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return (
            slotDate.getDate() === cellDate.getDate() &&
            slotDate.getMonth() === cellDate.getMonth() &&
            slotDate.getFullYear() === cellDate.getFullYear()
        );
      });

      const hasBooking = matchedSlots.some((s) => s.isBooked);
      const hasAvailability = matchedSlots.some((s) => !s.isBooked);

      let statusStyles = "text-foreground/70 border-transparent hover:bg-secondary/40";
      if (hasBooking) {
        statusStyles = "bg-rose-500 text-white font-bold rounded-full";
      } else if (hasAvailability) {
        statusStyles = "bg-violet-500/15 text-violet-500 font-bold rounded-full";
      }

      dayCells.push(
          <div
              key={`day-${day}`}
              className={`h-6 w-6 text-[11px] flex items-center justify-center transition-all cursor-default select-none ${statusStyles}`}
          >
            {day}
          </div>
      );
    }

    return dayCells;
  };

  if (loading) {
    return (
        <AppLayout>
          <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-80 rounded-2xl bg-muted/40 skeleton-shimmer" />
              <div className="md:col-span-2 h-80 rounded-2xl bg-muted/40 skeleton-shimmer" />
            </div>
          </div>
        </AppLayout>
    );
  }

  if (!mentor) {
    return (
        <AppLayout>
          <div className="p-6 text-center">
            <ErrorBanner error={error ?? "User profile mapping context dropped"} />
            <Button onClick={() => navigate("/search")} className="mt-4">Back to Dashboard</Button>
          </div>
        </AppLayout>
    );
  }

  const teachSkills = skills.filter((s) => s.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.skillType === "LEARN");
  const isOwnProfile = me?.id === mentor.id;

  const mentorLevel = mentor.level ?? 1;
  const mentorXp = mentor.xp ?? 0;
  const xpNeededForNextLevel = 100 - mentorXp;

  if (isOwnProfile) {
    return (
        <AppLayout>
          <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen">
            <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* LEFT SIDEBAR PROFILE CONTROLLER CARD */}
              <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="lg:col-span-3 p-6 rounded-3xl bg-gradient-to-b from-violet-500/10 via-orange-400/10 to-card border border-border shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center text-center lg:sticky lg:top-24"
              >
                {/* Profile Image / Initials Container with Float Pencil UI Element */}
                <div className="relative inline-block mb-4 w-24 h-24 mx-auto">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/15 via-fuchsia-500/10 to-transparent text-orange-400 border-2 border-orange-500/30 flex items-center justify-center font-heading font-black text-3xl shadow-[0_0_25px_rgba(249,115,22,0.15)] overflow-hidden">
                    {mentor.profilePictureUrl ? (
                        <img
                            src={mentor.profilePictureUrl}
                            alt={mentor.fullName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        getInitials(mentor.fullName)
                    )}
                  </div>

                  {/* Dedicated Floating Bottom-Right Pencil Action Button */}
                  <label
                      className={`absolute bottom-[-4px] right-[-4px] w-8 h-8 rounded-xl bg-card border border-orange-500/30 shadow-[0_4px_12px_rgba(249,115,22,0.2)] flex items-center justify-center cursor-pointer hover:border-orange-500/60 hover:bg-orange-500/5 transition-all duration-200 group/pencil ${uploadingPic ? 'opacity-50 pointer-events-none' : ''}`}
                      title="Upload profile picture"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-400 group-hover/pencil:scale-110 transition-transform" />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureUpload}
                        disabled={uploadingPic}
                    />
                  </label>

                  {/* Local Upload Loading Shimmer Overlay */}
                  {uploadingPic && (
                      <div className="absolute inset-0 rounded-full bg-card/80 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                  )}
                </div>

                <h1 className="text-2xl font-heading font-black tracking-tight text-foreground capitalize mb-1">
                  {mentor.fullName}
                </h1>
                <p className="text-slate-400 text-xs font-medium truncate mb-4">{mentor.bio}</p>

                {/* Balance Block Component */}
                <div className="w-full bg-card rounded-2xl border border-border p-4 shadow-sm mb-3 flex items-center justify-between text-left">
                  <div>
                    {/*<span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Balance</span>
                    <span className="text-lg font-black text-slate-800 mt-0.5 block">{me?.credits ?? 0}<span className="text-xs font-normal text-slate-500">  Credits </span>**/}

                    <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">Balance</span>
                    <span className="text-xl font-black text-foreground mt-0.5 block">{me.credits} <span className="text-xs font-normal text-muted-foreground">Credits</span></span>
                  </div>
                  <Coins className="w-8 h-8 text-[#FFB74D]/80 stroke-[1.5]" />
                </div>

                {/* REPUTATION BLOCK COMPONENT */}
                <div className="w-full bg-card rounded-2xl border border-border p-4 shadow-sm mb-6 text-left">
  <span className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider">
    Reputation
  </span>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    {/* 1. Dynamic Reputation Score Display */}
                    <span className="text-xl font-black text-foreground">
      {mentor.reputationScore ?? 0}
    </span>
                    <span className="text-xs font-medium text-muted-foreground">Points</span>
                  </div>

                  {/* Visual Star Rating representation based on their score hierarchy */}
                  <div className="flex gap-0.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#FFB74D] text-[#FFB74D]" />
                    ))}
                  </div>

                  {/* 2. Fully Dynamic Progress Logic Bar */}
                  <div className="w-full h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-orange-400 rounded-full transition-all duration-500 ease-out"
                        style={{
                          // Logic: Calculate how close they are to the next 100-point milestone tier
                          width: `${(mentor.reputationScore ?? 0) % 100}%`
                        }}
                    />
                  </div>
                </div>

                <Button
                    onClick={() => navigate("/create-profile", { state: { startStep: 1 } })}
                    className="w-full bg-gradient-to-r from-violet-500 to-orange-400 text-white rounded-2xl font-bold text-xs h-11 shadow-md hover:opacity-95 transition-opacity border-0"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Profile Description
                </Button>
              </motion.div>

              {/* MAIN METRIC LAYOUT CONTAINER DECK */}
              <div className="lg:col-span-9 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Teaching Deck */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-orange-400" /> Teaching
                      </h3>
                      <button
                          onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                          className="text-xs font-bold text-orange-400 hover:underline"
                      >
                        + Add Skill
                      </button>
                    </div>
                    {teachSkills.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No skills listed yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                          {teachSkills.map((us) => (
                              <Badge key={us.skillId} className="bg-gradient-to-r from-violet-500 to-orange-400 text-white border-0 px-3 py-1 rounded-xl text-xs font-medium capitalize flex items-center gap-2">
                                {us.skillName}
                                <X className="w-3 h-3 cursor-pointer opacity-80 hover:opacity-100" onClick={() => handleDeleteSkill(us)} />
                              </Badge>
                          ))}
                        </div>
                    )}
                  </div>

                  {/* Learning Deck */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-400" /> Learning
                      </h3>
                      <button
                          onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                          className="text-xs font-bold text-violet-400 hover:underline"
                      >
                        + Add Skill
                      </button>
                    </div>
                    {learnSkills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-2 space-y-1">
                          <BookOpen className="w-6 h-6 text-muted-foreground/40 stroke-[1.5]" />
                          <p className="text-xs text-muted-foreground font-medium">Ready to learn? <span className="text-violet-400 block">+ Add your first skill.</span></p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                          {learnSkills.map((us) => (
                              <Badge key={us.skillId} className="bg-secondary text-foreground hover:bg-secondary/70 border-0 px-3 py-1 rounded-xl text-xs font-medium capitalize flex items-center gap-2">
                                {us.skillName}
                                <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => handleDeleteSkill(us)} />
                              </Badge>
                          ))}
                        </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM MATRIX PANELS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* FRIEND LIST COMPONENT */}
                  <div className="md:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-violet-400" /> Friend List
                      </h3>

                      {friends.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground space-y-2">
                            <p className="text-xs italic">No connected friends yet.</p>
                          </div>
                      ) : (
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {friends.map((conn) => {
                              const friendObj = conn.sender.id === mentor.id ? conn.receiver : conn.sender;
                              return (
                                  <div key={conn.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-secondary border border-border">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/15 text-violet-500 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                                      {friendObj.profilePictureUrl ? (
                                          <img src={friendObj.profilePictureUrl} alt={friendObj.fullName} className="w-full h-full object-cover rounded-full" />
                                      ) : (
                                          getInitials(friendObj.fullName)
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-foreground truncate capitalize">{friendObj.fullName}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">Lvl {friendObj.level} • {friendObj.xp} XP</p>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* AVAILABILITY CALENDAR BLOCK */}
                  <div className="md:col-span-4 bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-violet-500" /> My Availability Calendar
                        </h3>

                        {/* Dynamic Navigation Button targeting the Scheduling Deck */}
                        <button
                            onClick={() => navigate("/my-schedule")}
                            className="text-[10px] font-bold text-purple-500 hover:text-purple-700 hover:underline transition-colors cursor-pointer"
                        >
                          + Add free slots
                        </button>
                      </div>

                      {/* Calendar Navigation and Month Controller Row */}
                      <div className="flex items-center justify-between mb-3 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
      <span className="text-[10px] font-bold uppercase text-slate-600 px-1">
        {currentDate.toLocaleString("en-US", { month: "short", year: "2-digit" })}
      </span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={handlePrevMonth} className="p-0.5 rounded text-slate-400 hover:bg-slate-100 transition-colors">
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button onClick={handleNextMonth} className="p-0.5 rounded text-slate-400 hover:bg-slate-100 transition-colors">
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase text-muted-foreground tracking-wider mb-1">
                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 justify-items-center mb-2">
                        {renderRealCalendarDays()}
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 space-y-1.5">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block">Next Slots</span>
                      {slots.filter(s => !s.isBooked).length === 0 ? (
                          <p className="text-[10px] text-muted-foreground italic">No slots open.</p>
                      ) : (
                          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2 text-[11px] text-violet-500 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="truncate">{fmt(slots.filter(s => !s.isBooked)[0].startTime)}</span>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* GROWTH DASHBOARD */}
                  <div className="md:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col items-center justify-between text-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground self-start">
                      Growth Dashboard
                    </h3>

                    <div className="flex items-center justify-around w-full mt-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Level</span>
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-secondary" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-violet-400" strokeDasharray="75, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-orange-400" strokeDasharray="45, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 5.5 a 12.5 12.5 0 0 1 0 25 a 12.5 12.5 0 0 1 0 -25" />
                          </svg>
                          <span className="text-2xl font-sans font-extrabold text-foreground relative z-10">{mentorLevel}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-2">XP Points</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="relative">
                            <div className="absolute inset-0 bg-amber-400/30 blur-md rounded-full scale-150 animate-pulse" />
                            <Zap className="w-6 h-6 text-amber-400 fill-amber-400 relative z-10 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                          </div>
                          <span className="text-2xl font-sans font-black tracking-tight text-foreground mt-1">
                            {mentorXp}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total Points</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full border-t border-border pt-3 mt-4 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                      <span>Next Level in {xpNeededForNextLevel} XP</span>
                      <svg className="w-16 h-5 text-violet-400" fill="none" viewBox="0 0 50 20" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17c5-3 10-12 15-8s8 8 15-2 10-11 16-11" />
                      </svg>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </AppLayout>
    );
  }

  {/* PUBLIC VIEW PROFILE ARCHITECTURE */}
  return (
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen">
          <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-5 text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* PUBLIC VIEW CARD PANEL */}
            <div className="lg:col-span-3 p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary text-foreground font-bold text-xl flex items-center justify-center mb-3 border-2 border-border overflow-hidden">
                {mentor.profilePictureUrl ? (
                    <img
                        src={mentor.profilePictureUrl}
                        alt={mentor.fullName}
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : (
                    getInitials(mentor.fullName)
                )}
              </div>
              <h1 className="text-lg font-bold text-foreground capitalize">{mentor.fullName}</h1>
              {mentor.bio && <p className="text-xs text-muted-foreground mt-3 mb-4 text-left bg-secondary p-3 rounded-xl border border-border">{mentor.bio}</p>}
              
              <Button
                  onClick={() => {
                    openWidget();
                    openChat({
                      contactId: mentor.id,
                      contactName: mentor.fullName,
                      contactProfilePicture: mentor.profilePictureUrl || null,
                      lastMessage: "",
                      lastMessageTime: null,
                      unreadCount: 0,
                    });
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-xs h-11 shadow-md hover:opacity-90 transition-opacity border-0"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </div>

            <div className="lg:col-span-9 space-y-6">
              {teachSkills.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-400" /> Skills Available For Learning
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {teachSkills.map((us) => (
                          <Badge key={us.skillId} className="px-3 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl font-medium text-xs capitalize">
                            {us.skillName}
                          </Badge>
                      ))}
                    </div>
                  </div>
              )}

              {/* TIMENODE SLOTS VIEWING DECK */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground mb-4">
                  <Clock className="w-4 h-4 text-violet-500" /> Open Available Timeslots
                </h3>
                {slots.filter(s => !s.isBooked).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8 bg-secondary/40 border border-dashed border-border rounded-xl">
                      No open slots listed right now.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {slots.filter(s => !s.isBooked).map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border hover:border-violet-400/50 transition-all">
                            <span className="text-xs font-semibold text-foreground">{fmt(slot.startTime)}</span>
                            <Button
                                size="sm"
                                className="h-8 rounded-xl px-4 text-xs font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:opacity-90 border-0"
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setBookingOpen(true);
                                }}
                            >
                              Book Session
                            </Button>
                          </div>
                      ))}
                    </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* DIALOG BOOKING CONFIRMATION PORTAL */}
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6 bg-card border border-border shadow-xl">
            <DialogHeader>
              <DialogTitle className="font-sans font-bold text-lg text-foreground">Confirm Session Request</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Please pick the skill or topic you want to learn during this session.
              </DialogDescription>
            </DialogHeader>

            {selectedSlot && (
                <div className="my-3 p-3.5 bg-secondary rounded-xl border border-border space-y-1">
                  <p className="text-xs text-foreground font-bold">{fmt(selectedSlot.startTime)}</p>
                  <p className="text-[11px] text-muted-foreground">Mentor: <span className="font-semibold text-foreground capitalize">{mentor.fullName}</span></p>
                </div>
            )}

            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Choose Topic</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                {teachSkills.map((us) => {
                  const isSelected = selectedSkill?.skillId === us.skillId;
                  return (
                      <Badge
                          key={us.skillId}
                          onClick={() => setSelectedSkill(us)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold capitalize cursor-pointer transition-all ${
                              isSelected
                                  ? "bg-violet-500/10 border-violet-400 text-violet-500 shadow-sm"
                                  : "bg-secondary/40 border-border text-foreground hover:bg-secondary"
                          }`}
                      >
                        {us.skillName}
                      </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setBookingOpen(false)} className="rounded-xl text-xs font-bold h-9">Cancel</Button>
              <Button
                  disabled={booking || !selectedSkill || !selectedSlot}
                  onClick={handleBook}
                  className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold px-4 text-xs h-9 shadow-md hover:opacity-90 border-0"
              >
                {booking ? "Booking..." : "Send Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
  );
};

export default ViewProfile;