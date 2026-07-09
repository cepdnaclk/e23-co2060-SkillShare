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
  Layers,
  X,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Smile,
  Frown,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
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
import { useChat } from "@/context/ChatContext";
import SkeletonCard from "@/components/SkeletonCard";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Calendar tracking states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Booking dialog
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
    ])
        .then(([u, sk, av]) => {
          setMentor(u);
          setSkills(sk);
          setSlots(av);
        })
        .catch((err: ApiError) => {
          setError(err.message ?? "Could not load profile.");
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
      toast.success("Session booked! Waiting for mentor confirmation.");
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

  // ── DYNAMIC CALENDAR ENGINE ───────────────────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const renderRealCalendarDays = () => {
    const dayCells = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      dayCells.push(<div key={`empty-${i}`} className="h-7 w-7 text-transparent" />);
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

      let statusStyles = "bg-secondary/20 text-muted-foreground/50 border-border/20 hover:border-border/60";
      if (hasBooking) {
        statusStyles = "bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold shadow-[0_0_8px_rgba(244,63,94,0.15)]";
      } else if (hasAvailability) {
        statusStyles = "bg-violet-500/15 border-violet-500/40 text-violet-400 font-bold";
      }

      dayCells.push(
          <div
              key={`day-${day}`}
              className={`h-7 w-7 rounded-lg border text-[10px] flex items-center justify-center transition-all cursor-default select-none ${statusStyles}`}
              title={
                hasBooking
                    ? `${matchedSlots.filter(s => s.isBooked).length} Session Booked`
                    : hasAvailability
                        ? `${matchedSlots.filter(s => !s.isBooked).length} Open Timeframes`
                        : undefined
              }
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
          <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 rounded-2xl skeleton-shimmer" />
              <div className="lg:col-span-2 space-y-6">
                <div className="h-44 rounded-2xl skeleton-shimmer" />
                <div className="h-48 rounded-2xl skeleton-shimmer" />
              </div>
            </div>
          </div>
        </AppLayout>
    );
  }

  if (!mentor) {
    return (
        <AppLayout>
          <div className="p-6 md:p-8 text-center">
            <ErrorBanner error={error ?? "User not found"} />
            <Button onClick={() => navigate("/search")} className="mt-4">
              Back to Search
            </Button>
          </div>
        </AppLayout>
    );
  }

  const teachSkills = skills.filter((s) => s.id.skillType === "TEACH");
  const learnSkills = skills.filter((s) => s.id.skillType === "LEARN");
  const isOwnProfile = me?.id === mentor.id;

  // ── REPUTATION FEEDBACK ALGORITHM (FRONTEND ENGINE) ───────────────────────────────────
  // Calculate dynamic ratios directly from the mentor's reputation score metric
  const maxReputationCap = 100;
  const positivePercentage = Math.min(
      100,
      Math.max(50, Math.round((mentor.reputationScore / maxReputationCap) * 100 || 85))
  );
  const negativePercentage = 100 - positivePercentage;

  // Calculate pixel bar heights contextually based on percentage out of a 56px scale container
  const positiveBarHeight = `${Math.round((positivePercentage / 100) * 56)}px`;
  const negativeBarHeight = `${Math.max(6, Math.round((negativePercentage / 100) * 56))}px`;

  if (isOwnProfile) {
    return (
        <AppLayout>
          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-12">
            <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

            {/* ASYMMETRIC BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* TILE 1: IDENTITY CARD (Fiery Glow Applied) */}
              <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-gradient-to-b from-card via-card to-orange-500/[0.04] border-2 border-orange-500/20 shadow-xl relative overflow-hidden text-center lg:text-left lg:sticky lg:top-24"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 via-fuchsia-500/10 to-transparent blur-2xl pointer-events-none" />

                <div className="relative inline-block mb-4 lg:block lg:mx-0">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/15 via-fuchsia-500/10 to-transparent text-orange-400 border-2 border-orange-500/30 flex items-center justify-center font-heading font-black text-3xl mx-auto lg:mx-0 shadow-[0_0_25px_rgba(249,115,22,0.15)]">
                    {getInitials(mentor.fullName)}
                  </div>
                  <span className="absolute bottom-0 right-0 lg:left-20 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-md animate-pulse" />
                </div>

                <h1 className="text-2xl font-heading font-black tracking-tight text-foreground capitalize mb-1">
                  {mentor.fullName}
                </h1>
                <p className="text-muted-foreground/80 text-xs font-medium truncate mb-4">{mentor.email}</p>

                {mentor.bio && (
                    <p className="text-muted-foreground text-xs leading-relaxed bg-secondary/40 p-3 rounded-xl border border-border/40 text-left mb-5">
                      {mentor.bio}
                    </p>
                )}

                {/* Internal Metrics List */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center justify-between text-xs font-bold bg-secondary/60 px-3 py-2.5 rounded-xl border border-border/60 shadow-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-500" /> Wallet balance</span>
                    <span className="text-foreground font-extrabold">{mentor.credits} Credits</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold bg-gradient-to-r from-orange-500/10 to-fuchsia-500/10 px-3 py-2.5 rounded-xl border border-orange-500/20 shadow-sm">
                    <span className="text-orange-400 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-orange-500/15" /> Node Reputation</span>
                    <span className="text-orange-400 font-black">Rep: {mentor.reputationScore}</span>
                  </div>
                </div>

                <Button
                    className="w-full gap-2 bg-secondary text-foreground hover:bg-secondary/80 border border-border/80 rounded-xl px-4 text-xs font-bold shadow-sm h-10 transition-all"
                    onClick={() => navigate("/create-profile", { state: { startStep: 1 } })}
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" /> Edit Profile Details
                </Button>
              </motion.div>

              {/* RIGHT SIDEBAR COMPARTMENTS */}
              <div className="lg:col-span-2 space-y-6">

                {/* TILE 2: EXPERTISE HUB CANVAS */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-6 rounded-2xl bg-gradient-to-b from-card to-card/70 border-2 border-border/80 shadow-lg relative overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Teach Deck */}
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground/90 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-orange-400" /> Skills I Teach
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-orange-400 hover:text-orange-300 hover:bg-orange-500/5 font-black uppercase tracking-wide"
                            onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                        >
                          + Add
                        </Button>
                      </div>
                      {teachSkills.length === 0 ? (
                          <p className="text-xs text-muted-foreground/70 py-2 italic">No teaching metrics active.</p>
                      ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {teachSkills.map((us) => (
                                <Badge
                                    key={us.id.skillId}
                                    className="gap-1.5 px-2.5 py-1 bg-orange-500/[0.08] text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold capitalize pr-1.5 shadow-inner"
                                >
                                  {us.skill.name}
                                  <button
                                      onClick={() => handleDeleteSkill(us)}
                                      disabled={deletingSkill === `${us.id.skillId}-${us.id.skillType}`}
                                      className="rounded p-0.5 opacity-50 hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-20"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                            ))}
                          </div>
                      )}
                    </div>

                    {/* Learn Deck */}
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground/90 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-fuchsia-400" /> Skills I'm Learning
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/5 font-black uppercase tracking-wide"
                            onClick={() => navigate("/create-profile", { state: { startStep: 2 } })}
                        >
                          + Add
                        </Button>
                      </div>
                      {learnSkills.length === 0 ? (
                          <p className="text-xs text-muted-foreground/70 py-2 italic">No focus targets monitored.</p>
                      ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {learnSkills.map((us) => (
                                <Badge
                                    key={us.id.skillId}
                                    className="gap-1.5 px-2.5 py-1 bg-fuchsia-500/[0.08] text-fuchsia-400 border border-fuchsia-500/20 rounded-lg text-xs font-semibold capitalize pr-1.5 shadow-inner"
                                >
                                  {us.skill.name}
                                  <button
                                      onClick={() => handleDeleteSkill(us)}
                                      disabled={deletingSkill === `${us.id.skillId}-${us.id.skillType}`}
                                      className="rounded p-0.5 opacity-50 hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-20"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                            ))}
                          </div>
                      )}
                    </div>

                  </div>
                </motion.div>

                {/* TILE 3: EXPANDED BOTTOM HALF (Sizing and Neon Accents Configured) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* BOTTOM LEFT: SCHEDULE CARD (Fiery Glow Applied) */}
                  <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-5 rounded-2xl bg-gradient-to-b from-card via-card to-fuchsia-500/[0.04] border-2 border-fuchsia-500/20 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-fuchsia-400" /> My Schedule Matrix
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                              onClick={handlePrevMonth}
                              className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-black uppercase tracking-tight text-foreground/90 px-1 min-w-[65px] text-center">
                          {currentDate.toLocaleString("en-US", { month: "short", year: "2-digit" })}
                        </span>
                          <button
                              onClick={handleNextMonth}
                              className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 justify-items-center mb-1 text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">
                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                      </div>

                      <div className="p-2.5 bg-secondary/30 border border-border/50 rounded-xl mb-3">
                        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                          {renderRealCalendarDays()}
                        </div>
                        <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-border/30 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-500/40 border border-violet-500" /> Available</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500/40 border border-rose-500" /> Booked</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-wider px-0.5">Upcoming Allocations</p>
                      {slots.filter(s => !s.isBooked).length === 0 ? (
                          <p className="text-[11px] text-muted-foreground/70 italic py-1">No active standalone windows logged.</p>
                      ) : (
                          <div className="space-y-1 max-h-[48px] overflow-y-auto custom-scrollbar">
                            {slots.filter(s => !s.isBooked).slice(0, 2).map((slot) => (
                                <div key={slot.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/40 text-[11px] text-muted-foreground">
                                  <Clock className="w-3 h-3 text-fuchsia-400 shrink-0" />
                                  <span className="font-medium text-foreground/90 truncate">{fmt(slot.startTime)}</span>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                  </motion.div>

                  {/* BOTTOM RIGHT: REAL PERFORMANCE RATINGS (Fiery Glow + Real Live Reputation Data) */}
                  <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="p-5 rounded-2xl bg-gradient-to-b from-card via-card to-orange-500/[0.04] border-2 border-orange-500/20 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-400" /> Performance & XP Tracker
                        </h3>
                        <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                          Live Rep Ratio
                        </Badge>
                      </div>
                    </div>

                    {/* Balanced visualization container with real data properties */}
                    <div className="my-auto py-2">
                      <div className="h-24 flex items-end justify-between gap-3 px-3 pt-6 pb-2 bg-secondary/20 border border-border/50 rounded-xl relative overflow-hidden">
                        <div className="absolute top-2 left-3 text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Smile className="w-3 h-3 text-emerald-400" /> Real Feedback Percentage
                        </div>

                        {/* Real Positive Bar */}
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <div
                              style={{ height: positiveBarHeight }}
                              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all duration-500"
                          />
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                          <Smile className="w-3 h-3" /> {positivePercentage}%
                        </span>
                        </div>

                        {/* Real Negative Bar */}
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <div
                              style={{ height: negativeBarHeight }}
                              className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md shadow-[0_0_12px_rgba(244,63,94,0.1)] transition-all duration-500"
                          />
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                          <Frown className="w-3 h-3" /> {negativePercentage}%
                        </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Messaging Block using current Node Reputation stats */}
                    <div className="p-2.5 rounded-xl bg-orange-500/[0.04] border border-orange-500/20 text-center">
                      <p className="text-[11px] font-bold text-orange-400/90 leading-tight">
                        🚀 Verified Node Weight: {mentor.reputationScore} Rep
                      </p>
                      <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                        Graph calculated instantly from real reputation ratios.
                      </p>
                    </div>
                  </motion.div>

                </div>
              </div>

            </div>
          </div>
        </AppLayout>
    );
  }

  // ── PUBLIC VIEW PROFILE ENCOUNTER ──────────────────────────────────────────────────────────
  return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-12">

          <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-5 text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-orange-400" /> Return
          </button>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* PUBLIC IDENTITY TILE (Fiery Glow Applied) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-gradient-to-b from-card via-card to-orange-500/[0.04] border-2 border-orange-500/20 shadow-xl text-center lg:text-left lg:sticky lg:top-24 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 via-fuchsia-500/10 to-transparent blur-2xl pointer-events-none" />

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/15 via-fuchsia-500/10 to-transparent text-orange-400 border border-orange-500/20 flex items-center justify-center font-heading font-black text-2xl mx-auto lg:mx-0 mb-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                {getInitials(mentor.fullName)}
              </div>

              <h1 className="text-2xl font-heading font-black tracking-tight text-foreground capitalize mb-1">
                {mentor.fullName}
              </h1>

              {mentor.bio && (
                  <p className="text-muted-foreground text-xs leading-relaxed bg-secondary/40 p-3 rounded-xl border border-border/40 text-left mt-3 mb-5">
                    {mentor.bio}
                  </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold bg-secondary/60 px-3 py-2.5 rounded-xl border border-border/60 shadow-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-500" /> Credit Matrix</span>
                  <span className="text-foreground">{mentor.credits} Balance</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold bg-gradient-to-r from-orange-500/10 to-fuchsia-500/10 px-3 py-2.5 rounded-xl border border-orange-500/20 shadow-sm">
                  <span className="text-orange-400 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-orange-500/15" /> Reputation weight</span>
                  <span className="text-orange-400 font-extrabold">Rep: {mentor.reputationScore}</span>
                </div>
              </div>
            </motion.div>

            {/* PUBLIC CONTENT BLOCKS */}
            <div className="lg:col-span-2 space-y-6">

              {teachSkills.length > 0 && (
                  <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-5 rounded-2xl bg-gradient-to-b from-card to-card/70 border-2 border-border/80 shadow-md"
                  >
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-400" /> Expertise Available For Booking
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {teachSkills.map((us) => (
                          <Badge
                              key={us.id.skillId}
                              className="px-3 py-1.5 bg-orange-500/[0.08] text-orange-400 border border-orange-500/20 rounded-xl font-bold text-xs capitalize shadow-inner"
                          >
                            {us.skill.name}
                          </Badge>
                      ))}
                    </div>
                  </motion.div>
              )}

              {/* PUBLIC TIMESLOT MATRIX (Fiery Border Overlay Elements Added) */}
              <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-5 rounded-2xl bg-gradient-to-b from-card via-card to-fuchsia-500/[0.02] border-2 border-fuchsia-500/20 shadow-md relative"
              >
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground mb-4">
                  <Clock className="w-4 h-4 text-fuchsia-400" /> Operational Slots Open
                </h3>
                {slots.filter(s => !s.isBooked).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10 bg-secondary/20 border border-dashed border-border/60 rounded-xl">
                      No operational timeframe blocks listed at this moment.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {slots.filter(s => !s.isBooked).map((slot) => (
                          <div
                              key={slot.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 hover:bg-secondary/70 hover:border-border transition-all shadow-inner group"
                          >
                            <div className="flex items-center gap-2 text-xs md:text-sm">
                              <Calendar className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                              <span className="font-bold text-foreground/90">{fmt(slot.startTime)}</span>
                              <span className="text-muted-foreground font-light">→</span>
                              <span className="text-muted-foreground font-medium">{fmt(slot.endTime)}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-black border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-xl px-3.5 transition-colors uppercase tracking-wide"
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setBookingOpen(true);
                                }}
                            >
                              Book
                            </Button>
                          </div>
                      ))}
                    </div>
                )}
              </motion.div>

              <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-4 pt-2"
              >
                {slots.filter(s => !s.isBooked).length > 0 && (
                    <Button
                        className="flex-1 h-12 gap-2 bg-gradient-to-r from-orange-600 via-fuchsia-500 to-orange-500 text-white border-0 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300"
                        onClick={() => setBookingOpen(true)}
                    >
                      <Calendar className="w-4 h-4 shrink-0" /> Book a Session Now
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="flex-1 h-12 gap-2 border-border/80 hover:bg-secondary text-foreground font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-sm transition-colors"
                    onClick={() => {
                      openWidget();
                      openChat({
                        contactId: mentor.id,
                        contactName: mentor.fullName,
                        contactProfilePicture: null,
                        lastMessage: "",
                        lastMessageTime: null,
                        unreadCount: 0,
                      });
                    }}
                >
                  <MessageSquare className="w-4 h-4 text-fuchsia-400 shrink-0" /> Launch Chat
                </Button>
              </motion.div>

            </div>
          </div>

          {/* BOOKING DIALOG WINDOW */}
          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogContent className="bg-card border-2 border-border/80 max-w-md rounded-2xl shadow-xl p-6">
              <DialogHeader className="pb-2 border-b border-border/40">
                <DialogTitle className="font-heading font-black text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Configure Booking
                </DialogTitle>
                <DialogDescription className="text-xs pt-1">
                  Select specific expertise context and valid availability slot to book with{" "}
                  <span className="text-foreground font-bold bg-secondary px-1 py-0.5 rounded capitalize">{mentor.fullName}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Target Expertise</p>
                  {preselectedSkillId ? (
                      <div className="px-3.5 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-sm capitalize">
                        🎯 {selectedSkill?.skill.name ?? "Selected from active search context"}
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-2">
                        {teachSkills.map((us) => (
                            <button
                                key={us.id.skillId}
                                onClick={() => setSelectedSkill(us)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                                    selectedSkill?.id.skillId === us.id.skillId
                                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                        : "bg-secondary border-border/60 text-muted-foreground hover:border-orange-500/30"
                                }`}
                            >
                              {us.skill.name}
                            </button>
                        ))}
                      </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Available Time Window</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {slots.filter(s => !s.isBooked).map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all ${
                                selectedSlot?.id === slot.id
                                    ? "bg-orange-500/10 border-orange-500/40 text-orange-400 font-bold shadow-inner"
                                    : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-orange-500/20"
                            }`}
                        >
                          📅 {fmt(slot.startTime)} → {fmt(slot.endTime)}
                        </button>
                    ))}
                  </div>
                </div>

                <Button
                    className="w-full h-11 gap-2 bg-gradient-to-r from-orange-600 via-fuchsia-500 to-orange-500 text-white border-0 font-black rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-300 mt-2"
                    disabled={!selectedSkill || !selectedSlot || booking}
                    onClick={handleBook}
                >
                  {booking ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing Request…
                      </>
                  ) : (
                      "Confirm Session Booking"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
  );
};

export default ViewProfile;