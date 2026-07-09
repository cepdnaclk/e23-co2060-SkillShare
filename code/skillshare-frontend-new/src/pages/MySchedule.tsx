import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Calendar, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; // Fixed import path
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  availabilityApi,
  sessionsApi,
  type Availability,
  type Session,
  type ApiError,
  type SessionStatus
} from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";

// --- Framer Motion Configuration ---
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// --- Formatting Helpers ---
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

// --- Dynamic Styling Matrices ---
const STATUS_CLASSES: Record<SessionStatus | "FREE", string> = {
  FREE:      "bg-emerald-500 text-white border-0",
  PENDING:   "bg-amber-500 text-white border-0",
  ACCEPTED:  "bg-violet-500 text-white border-0",
  REJECTED:  "bg-red-500 text-white border-0",
  COMPLETED: "bg-emerald-500 text-white border-0",
  EXPIRED:   "bg-muted text-muted-foreground border-0",
  CANCELLED: "bg-red-500 text-white border-0",
};

const cardStyles = {
  FREE: {
    bg: "bg-gradient-to-br from-emerald-500/[0.04] via-emerald-500/[0.01] to-transparent",
    border: "border-emerald-500/20 hover:border-emerald-500/50 shadow-[0_4px_20px_rgba(16,185,129,0.02)]",
    iconBox: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600"
  },
  PENDING: {
    bg: "bg-gradient-to-br from-amber-500/[0.04] via-amber-500/[0.01] to-transparent",
    border: "border-amber-500/20 hover:border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.02)]",
    iconBox: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600"
  },
  ACCEPTED: {
    bg: "bg-gradient-to-br from-violet-500/[0.05] via-violet-500/[0.01] to-transparent",
    border: "border-violet-500/20 hover:border-violet-500/50 shadow-[0_4px_20px_rgba(139,92,246,0.02)]",
    iconBox: "from-violet-500/10 to-purple-500/10 border-violet-500/20 text-violet-600"
  }
};

const MySchedule = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [bookedSessions, setBookedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      availabilityApi.getMentorSlots(user.id),
      sessionsApi.getMentorSessions(user.id),
    ])
      .then(([slotsData, sessionsData]) => {
        setSlots(slotsData);
        const activeBookedSessions = sessionsData.filter(
          s => s.status === "PENDING" || s.status === "ACCEPTED"
        );
        setBookedSessions(activeBookedSessions);
      })
      .catch((err: ApiError) =>
        setError(err.message ?? "Failed to load schedule.")
      )
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAdd = async () => {
    if (!startTime || !endTime || new Date(startTime) >= new Date(endTime)) {
      toast.error("Please select a valid time range.");
      return;
    }
    setSaving(true);
    try {
      const newSlot = await availabilityApi.add(startTime, endTime);
      setSlots(prev => [...prev, newSlot]);
      setStartTime(""); setEndTime(""); setShowForm(false);
      toast.success("Availability slot added! 🎉");
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to add slot.");
    } finally { setSaving(false); }
  };

  const freeSlots = slots;
  const bookedSlots = bookedSessions;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 md:pb-8">
        
        {/* --- LEFT COLUMN: Main Content --- */}
        <div className="flex-1 max-w-3xl w-full">
          
          {/* A. Gradient Banner */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-1 mb-6 p-5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-md"
          >
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">My Schedule</h1>
            <p className="text-white/90 text-sm">Manage your availability for skill-sharing sessions.</p>
          </motion.div>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

          {/* B. Add Slot Trigger */}
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)} 
              className="mb-6 h-11 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-95 text-white border-0 shadow-md font-semibold transition-all duration-300"
            >
              <Plus className="w-4 h-4" /> Add Free Slot
            </Button>
          )}

          {/* C. Add Slot Form (Animated) */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                className="mb-8 p-6 rounded-2xl bg-card border-2 border-border/80 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between mb-5 border-b border-border/50 pb-4">
                  <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <Calendar className="w-4 h-4 text-white" />
                     </div>
                     New Availability Slot
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-secondary border-2 border-border/80 h-11 rounded-xl focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Time</Label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-secondary border-2 border-border/80 h-11 rounded-xl focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
                {startTime && endTime && new Date(startTime) >= new Date(endTime) && (
                  <p className="text-xs font-medium text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20 mb-4 w-fit">
                    ⚠️ End time must be after start time.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAdd} 
                    disabled={saving || !startTime || !endTime || new Date(startTime) >= new Date(endTime)} 
                    className="gap-2 h-10 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white border-0 shadow-md font-medium px-6"
                  >
                    {saving ? "Saving…" : <><Sparkles className="w-4 h-4" /> Save Slot</>}
                  </Button>
                  <Button variant="outline" className="h-10 border-border/80" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* D. Main Loading & Lists */}
          {loading ? (
            <SkeletonList count={3} />
          ) : (
            <div className="space-y-8">
              
              {/* Free Slots */}
              {freeSlots.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available Slots ({freeSlots.length})
                  </h4>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {freeSlots.map(slot => (
                      <motion.div
                        key={slot.id}
                        variants={fadeUp}
                        whileHover={{ y: -2 }}
                        className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 ${cardStyles.FREE.bg} ${cardStyles.FREE.border}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center shadow-sm flex-shrink-0 ${cardStyles.FREE.iconBox}`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                              {formatDate(slot.startTime)}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" />
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${STATUS_CLASSES.FREE} text-xs font-semibold px-2.5 py-0.5 shadow-sm w-fit`}>
                          FREE
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Booked Slots */}
              {bookedSlots.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Booked Sessions ({bookedSlots.length})
                  </h4>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {bookedSlots.map(session => {
                      const sType = session.status === "PENDING" ? cardStyles.PENDING : cardStyles.ACCEPTED;
                      return (
                        <motion.div
                          key={session.id}
                          variants={fadeUp}
                          whileHover={{ y: -2 }}
                          className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 ${sType.bg} ${sType.border}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center shadow-sm flex-shrink-0 ${sType.iconBox}`}>
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="font-semibold text-foreground text-sm flex items-center gap-2 capitalize">
                                {session.learnerName}
                              </p>
                              <div className="flex flex-col gap-1 mt-1">
                                <p className="text-[11px] font-medium text-foreground bg-secondary/60 w-fit px-1.5 py-0.5 rounded border border-border/40">
                                  {session.skillName}
                                </p>
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDate(session.startTime)} | {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge className={`${STATUS_CLASSES[session.status as keyof typeof STATUS_CLASSES]} text-xs font-semibold px-2.5 py-0.5 shadow-sm w-fit`}>
                            {session.status}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {slots.length === 0 && !showForm && (
                <div className="text-center py-16 text-muted-foreground rounded-2xl border-2 border-dashed border-border/60 bg-card">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-heading font-semibold text-lg text-foreground">No time slots added yet</p>
                  <p className="text-sm mt-1 max-w-sm mx-auto px-4">Add your free time so learners can book sessions with you.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Premium Analytics Sidebar --- */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-card to-card/70 border-2 border-border/80 shadow-lg backdrop-blur-md relative overflow-hidden">
            
            {/* Decorative background glow mesh */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

            <h4 className="font-heading font-extrabold text-base tracking-tight text-foreground mb-5 flex items-center gap-2.5">
              <span className="text-xl filter drop-shadow-sm">🗓️</span>
              Slot Summary
            </h4>

            <div className="space-y-5">
              {/* Highlight Metrics */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 block mb-2.5">
                  Current Week Overview
                </span>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Free Pill */}
                  <div className="bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.02] p-4 rounded-xl border border-emerald-500/30 shadow-sm transition-all hover:border-emerald-500/50">
                    <span className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 block uppercase tracking-wide">
                      Free Slots
                    </span>
                    <span className="text-2xl font-black font-heading text-foreground mt-1 block tracking-tight">
                      {freeSlots.length}
                    </span>
                  </div>

                  {/* Booked Pill */}
                  <div className="bg-gradient-to-br from-violet-500/[0.07] to-purple-500/[0.02] p-4 rounded-xl border border-violet-500/30 shadow-sm transition-all hover:border-violet-500/50">
                    <span className="text-[11px] font-bold text-violet-500 dark:text-violet-400 block uppercase tracking-wide">
                      Booked
                    </span>
                    <span className="text-2xl font-black font-heading text-foreground mt-1 block tracking-tight">
                      {bookedSessions.length}
                    </span>
                  </div>

                </div>
              </div>

              {/* Status List */}
              <div className="pt-4 border-t border-border/80 space-y-3.5">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                    <span className="text-muted-foreground">📈</span> Total Created:
                  </span>
                  <span className="font-bold text-sm text-foreground bg-secondary/80 px-3 py-1 rounded-xl border border-border shadow-inner">
                    {slots.length} slots
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/[0.04] to-teal-500/[0.04] border-2 border-dashed border-emerald-500/20 shadow-sm">
            <p className="text-xs text-muted-foreground/90 leading-relaxed">
              ✨ <strong className="text-foreground font-semibold">Pro Tip:</strong> Keeping your schedule updated ensures you appear higher in search results when learners look for mentors.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default MySchedule;