import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Calendar, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { availabilityApi } from "@/api/availability.api";
import { sessionsApi } from "@/api/sessions.api";
import type { AvailabilityResponse, SessionResponse, SessionStatus } from "@/api/types";
import type { ApiError } from "@/api/client";
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
  ACCEPTED:  "bg-primary text-white border-0",
  REJECTED:  "bg-red-500 text-white border-0",
  COMPLETED: "bg-emerald-500 text-white border-0",
  EXPIRED:   "bg-muted text-muted-foreground border-0",
  CANCELLED: "bg-red-500 text-white border-0",
};

const cardStyles = {
  FREE: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBox: "bg-emerald-500/10 text-emerald-600"
  },
  PENDING: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20 hover:border-amber-500/40",
    iconBox: "bg-amber-500/10 text-amber-600"
  },
  ACCEPTED: {
    bg: "bg-primary/5",
    border: "border-primary/20 hover:border-primary/40",
    iconBox: "bg-primary/10 text-primary"
  }
};

const MySchedule = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilityResponse[]>([]);
  const [bookedSessions, setBookedSessions] = useState<SessionResponse[]>([]);
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
          
          {/* A. Banner */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-1 mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Schedule</h1>
            <p className="text-muted-foreground text-sm">Manage your availability for skill-sharing sessions.</p>
          </motion.div>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

          {/* B. Add Slot Trigger */}
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)} 
              className="mb-8 h-11 gap-2 font-medium"
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
                className="mb-8 p-6 rounded-xl bg-card border border-border shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between mb-5 border-b border-border pb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                     </div>
                     New Availability Slot
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-secondary/50 h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Time</Label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-secondary/50 h-11 rounded-lg"
                    />
                  </div>
                </div>
                {startTime && endTime && new Date(startTime) >= new Date(endTime) && (
                  <p className="text-xs font-medium text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-200 mb-4 w-fit">
                    ⚠️ End time must be after start time.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAdd} 
                    disabled={saving || !startTime || !endTime || new Date(startTime) >= new Date(endTime)} 
                    className="gap-2 h-10 px-6 font-medium"
                  >
                    {saving ? "Saving…" : <><Sparkles className="w-4 h-4" /> Save Slot</>}
                  </Button>
                  <Button variant="outline" className="h-10" onClick={() => setShowForm(false)}>
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Available Slots ({freeSlots.length})
                  </h4>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {freeSlots.map(slot => (
                      <motion.div
                        key={slot.id}
                        variants={fadeUp}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 ${cardStyles.FREE.bg} ${cardStyles.FREE.border}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cardStyles.FREE.iconBox}`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                              {formatDate(slot.startTime)}
                            </p>
                            <p className="text-xs font-medium text-emerald-600/80 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`${STATUS_CLASSES.FREE} px-2.5 h-6 rounded-full text-[11px]`}>
                          Available
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Booked Slots */}
              {bookedSlots.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Booked & Pending ({bookedSlots.length})
                  </h4>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {bookedSlots.map(session => {
                      const style = cardStyles[session.status as keyof typeof cardStyles] || cardStyles.PENDING;
                      return (
                        <motion.div
                          key={session.id}
                          variants={fadeUp}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 ${style.bg} ${style.border}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style.iconBox}`}>
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                                {session.skillName} <span className="text-muted-foreground font-normal text-xs ml-1">with {session.learnerName}</span>
                              </p>
                              <p className="text-xs font-medium opacity-80 mt-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(session.startTime)} at {formatTime(session.startTime)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className={`${STATUS_CLASSES[session.status as keyof typeof STATUS_CLASSES]} px-2.5 h-6 rounded-full text-[11px]`}>
                            {session.status}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {/* Empty State */}
              {freeSlots.length === 0 && bookedSlots.length === 0 && (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border/60 bg-card">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-base font-semibold text-foreground mb-1">Your schedule is empty</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Add availability slots to let other users know when you're free to teach or learn.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Tips --- */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm sticky top-24">
            <h4 className="font-semibold text-foreground mb-4">Tips for a good schedule</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">1</span>
                <span>Keep slots small (1-2 hours) to increase likelihood of a match.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">2</span>
                <span>Add slots at least 24 hours in advance so others can plan.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">3</span>
                <span>Once a session is requested, it moves from Available to Booked.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MySchedule;