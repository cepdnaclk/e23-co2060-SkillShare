import { useEffect, useState } from "react";
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

// Extended connection models matching your backend controller structure
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

// Inline API addition for Connections endpoints
const connectionsApi = {
  getFriends: async (): Promise<ConnectionDto[]> => {
    // Dynamically matching your backend endpoint mapping URL path
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
  const { user: me } = useAuth();
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
              s.id.skillId === preselectedSkillId && s.id.skillType === "TEACH",
      );

      if (matched) {
        setSelectedSkill(matched);
      }
    }
  }, [preselectedSkillId, skills]);

  const handleDeleteSkill = async (us: UserSkill) => {
    const key = `${us.id.skillId}-${us.id.skillType}`;
    if (deletingSkill === key) return;
    setDeletingSkill(key);
    try {
      await userSkillsApi.remove(String(us.id.skillId), us.id.skillType);
      setSkills((prev) =>
          prev.filter(
              (s) =>
                  !(
                      s.id.skillId === us.id.skillId &&
                      s.id.skillType === us.id.skillType
                  ),
          ),
      );
      toast.success(`"${us.skill.name}" removed.`);
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
      await sessionsApi.book(me.id, selectedSkill.skill.id, selectedSlot.id);
      toast.success("Session booked! Waiting for confirmation.");
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
        statusStyles = "bg-purple-100 text-purple-700 font-bold rounded-full";
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

  const teachSkills = skills.filter((s) => s.id.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.id.skillType === "LEARN");
  const isOwnProfile = me?.id === mentor.id;

  const mentorLevel = mentor.level ?? 1;
  const mentorXp = mentor.xp ?? 0;

  // Calculates contextual target benchmarks matching diagram metadata profiles
  const xpNeededForNextLevel = 35;

  if (isOwnProfile) {
    return (
        <AppLayout>
          <div className="p-6 max-w-7xl mx-auto bg-[#F9FAFC] min-h-screen">
            <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* LEFT SIDEBAR PROFILE CONTROLLER CARD */}
              <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="lg:col-span-3 p-6 rounded-3xl bg-gradient-to-b from-[#E3F2FD]/50 via-[#FFF3E0]/30 to-white border border-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center text-center lg:sticky lg:top-24"
              >
                {/* Profile Halo Image Frame */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-[0_0_16px_rgba(56,189,248,0.15)] flex items-center justify-center border-2 border-[#4FC3F7]">
                    <div className="w-full h-full rounded-full bg-[#FFE0B2] text-[#E65100] flex items-center justify-center font-bold text-2xl font-sans">
                      {getInitials(mentor.fullName)}
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#4CAF50] border-4 border-white" />
                </div>

                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  {mentor.fullName}
                </h1>
                <p className="text-slate-400 text-xs mt-0.5 mb-6">@{mentor.fullName.toLowerCase().replace(/\s+/g, '_')}</p>

                {/* Balance Block Component */}
                <div className="w-full bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-3 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Balance</span>
                    <span className="text-xl font-black text-slate-800 mt-0.5 block">{mentor.credits} <span className="text-xs font-normal text-slate-500">Credits</span></span>
                  </div>
                  <Coins className="w-8 h-8 text-[#FFB74D]/80 stroke-[1.5]" />
                </div>

                {/* Reputation Block Component */}
                <div className="w-full bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 text-left">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Reputation</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-slate-800">{mentor.reputationScore}</span>
                    <span className="text-xs font-medium text-slate-500">Points</span>
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#FFB74D] text-[#FFB74D]" />
                    ))}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-orange-400 w-3/4 rounded-full" />
                  </div>
                </div>

                <Button
                    onClick={() => navigate("/create-profile", { state: { startStep: 1 } })}
                    className="w-full bg-gradient-to-r from-[#7E57C2] to-[#FF7043] text-white rounded-2xl font-bold text-xs h-11 shadow-md hover:opacity-95 transition-opacity"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Profile
                </Button>
              </motion.div>

              {/* MAIN METRIC LAYOUT CONTAINER DECK */}
              <div className="lg:col-span-9 space-y-6">

                {/* TOP ROW: SKILLS GRID PANELS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Teaching Deck */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
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
                        <p className="text-xs text-slate-400 italic py-2">No skills listed yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                          {teachSkills.map((us) => (
                              <Badge key={us.id.skillId} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1 rounded-xl text-xs font-medium capitalize flex items-center gap-2">
                                {us.skill.name}
                                <X className="w-3 h-3 cursor-pointer opacity-80 hover:opacity-100" onClick={() => handleDeleteSkill(us)} />
                              </Badge>
                          ))}
                        </div>
                    )}
                  </div>

                  {/* Learning Deck */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" /> Learning
                      </h3>
                      <button
                          onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                          className="text-xs font-bold text-purple-400 hover:underline"
                      >
                        + Add Skill
                      </button>
                    </div>
                    {learnSkills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-2 space-y-1">
                          <BookOpen className="w-6 h-6 text-slate-300 stroke-[1.5]" />
                          <p className="text-xs text-slate-400 font-medium">Ready to learn? <span className="text-purple-400 block">+ Add your first skill.</span></p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                          {learnSkills.map((us) => (
                              <Badge key={us.id.skillId} className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 px-3 py-1 rounded-xl text-xs font-medium capitalize flex items-center gap-2">
                                {us.skill.name}
                                <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => handleDeleteSkill(us)} />
                              </Badge>
                          ))}
                        </div>
                    )}
                  </div>

                </div>

                {/* BOTTOM ROW: MATRIX LAYOUT SYSTEM */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                  {/* SUB PANEL 1: FRIEND LIST COMPONENT (COMMUNITY ACTIVITY OVERRIDE RENDER) */}
                  <div className="md:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-blue-500" /> Friend List
                      </h3>

                      {friends.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 space-y-2">
                            <p className="text-xs italic">No connected friends yet.</p>
                          </div>
                      ) : (
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {friends.map((conn) => {
                              // Extract connection peer dynamic context mappings
                              const friendObj = conn.sender.id === mentor.id ? conn.receiver : conn.sender;
                              return (
                                  <div key={conn.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                                      {getInitials(friendObj.fullName)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-700 truncate capitalize">{friendObj.fullName}</p>
                                      <p className="text-[10px] text-slate-400 truncate">Lvl {friendObj.level} • {friendObj.xp} XP</p>
                                    </div>
                                  </div>
                              );
                            })}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* SUB PANEL 2: AVAILABILITY CALENDAR BLOCK */}
                  <div className="md:col-span-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" /> My Availability Calendar
                        </h3>
                        <div className="flex items-center gap-0.5">
                          <button onClick={handlePrevMonth} className="p-0.5 rounded text-slate-400 hover:bg-slate-100">
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold uppercase text-slate-600 px-1">
                            {currentDate.toLocaleString("en-US", { month: "short", year: "2-digit" })}
                          </span>
                          <button onClick={handleNextMonth} className="p-0.5 rounded text-slate-400 hover:bg-slate-100">
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 justify-items-center mb-2">
                        {renderRealCalendarDays()}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Next Slots</span>
                      {slots.filter(s => !s.isBooked).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No slots open.</p>
                      ) : (
                          <div className="p-2 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-2 text-[11px] text-purple-700 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="truncate">{fmt(slots.filter(s => !s.isBooked)[0].startTime)}</span>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* SUB PANEL 3: GROWTH DASHBOARD (EXACT COLOR BENCHMARK MATCH) */}
                  <div className="md:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col items-center justify-between text-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 self-start">
                      Growth Dashboard
                    </h3>

                    {/* Concentric Circle Progress Graph Section */}
                    <div className="flex items-center justify-around w-full mt-2">

                      {/* Level Ring Structure Block */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mb-2">Level</span>
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          {/* Outer Track Circular Graphics */}
                          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-blue-400" strokeDasharray="75, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-orange-400" strokeDasharray="45, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 5.5 a 12.5 12.5 0 0 1 0 25 a 12.5 12.5 0 0 1 0 -25" />
                          </svg>
                          <span className="text-2xl font-sans font-extrabold text-slate-800 relative z-10">{mentorLevel}</span>
                        </div>
                      </div>

                      {/* Stacked Vertical XP Configuration Element matching precise drawing context guidelines */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mb-2">XP Points</span>
                        <div className="flex flex-col items-center gap-0.5">

                          {/* Ambient Pulsing Glow Lightning Bolt */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-amber-400/30 blur-md rounded-full scale-150 animate-pulse" />
                            <Zap className="w-6 h-6 text-amber-400 fill-amber-400 relative z-10 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                          </div>

                          <span className="text-2xl font-sans font-black tracking-tight text-slate-800 mt-1">
                            {mentorXp}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total Points</span>
                        </div>
                      </div>

                    </div>

                    {/* Progress Goal Tracker text */}
                    <div className="w-full border-t border-slate-50 pt-3 mt-4 flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span>Next Level in {xpNeededForNextLevel} XP</span>
                      {/* Decorative Line Graph mimicking diagram metric paths */}
                      <svg className="w-16 h-5 text-purple-400" fill="none" viewBox="0 0 50 20" stroke="currentColor" strokeWidth="2">
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
        <div className="p-6 max-w-7xl mx-auto bg-[#F9FAFC] min-h-screen">
          <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 mb-5 text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* PUBLIC VIEW CARD PANEL */}
            <div className="lg:col-span-3 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-600 font-bold text-xl flex items-center justify-center mb-3 border-2 border-slate-200">
                {getInitials(mentor.fullName)}
              </div>
              <h1 className="text-lg font-bold text-slate-800 capitalize">{mentor.fullName}</h1>
              {mentor.bio && <p className="text-xs text-slate-400 mt-3 mb-4 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">{mentor.bio}</p>}
              
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
                  className="w-full mt-4 bg-purple-600 text-white rounded-2xl font-bold text-xs h-11 shadow-md hover:bg-purple-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </div>

            <div className="lg:col-span-9 space-y-6">
              {teachSkills.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-400" /> Skills Available For Learning
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {teachSkills.map((us) => (
                          <Badge key={us.id.skillId} className="px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl font-medium text-xs capitalize">
                            {us.skill.name}
                          </Badge>
                      ))}
                    </div>
                  </div>
              )}

              {/* TIMENODE SLOTS VIEWING DECK */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">
                  <Clock className="w-4 h-4 text-purple-500" /> Open Available Timeslots
                </h3>
                {slots.filter(s => !s.isBooked).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                      No open slots listed right now.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {slots.filter(s => !s.isBooked).map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-300 transition-all">
                            <span className="text-xs font-semibold text-slate-700">{fmt(slot.startTime)}</span>
                            <Button
                                size="sm"
                                className="h-8 rounded-xl px-4 text-xs font-bold bg-purple-600 text-white shadow-sm hover:bg-purple-700"
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
          <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-100 shadow-xl">
            <DialogHeader>
              <DialogTitle className="font-sans font-bold text-lg text-slate-800">Confirm Session Request</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Please pick the skill or topic you want to learn during this session.
              </DialogDescription>
            </DialogHeader>

            {selectedSlot && (
                <div className="my-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs text-slate-700 font-bold">{fmt(selectedSlot.startTime)}</p>
                  <p className="text-[11px] text-slate-400">Mentor: <span className="font-semibold text-slate-600 capitalize">{mentor.fullName}</span></p>
                </div>
            )}

            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Choose Topic</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                {teachSkills.map((us) => {
                  const isSelected = selectedSkill?.skill.id === us.skill.id;
                  return (
                      <div
                          key={us.skill.id}
                          onClick={() => setSelectedSkill(us)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold capitalize cursor-pointer transition-all ${
                              isSelected
                                  ? "bg-purple-50 border-purple-400 text-purple-600 shadow-sm"
                                  : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        {us.skill.name}
                      </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setBookingOpen(false)} className="rounded-xl text-xs font-bold h-9">Cancel</Button>
              <Button
                  disabled={booking || !selectedSkill || !selectedSlot}
                  onClick={handleBook}
                  className="rounded-xl bg-purple-600 text-white font-bold px-4 text-xs h-9 shadow-md hover:bg-purple-700"
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