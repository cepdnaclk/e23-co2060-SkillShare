import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Calendar, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  availabilityApi,
  sessionsApi,
  type Availability,
  type Session,
  type ApiError,
} from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// ─── Animation Variants ──────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MySchedule = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [bookedSessions, setBookedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const startDateTime = date && startTime ? `${date}T${startTime}` : "";
  const endDateTime = date && endTime ? `${date}T${endTime}` : "";
  const isValidTime =
    Boolean(startDateTime && endDateTime) &&
    new Date(startDateTime) < new Date(endDateTime);

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
          (s) => s.status === "PENDING" || s.status === "ACCEPTED",
        );

        setBookedSessions(activeBookedSessions);
      })
      .catch((err: ApiError) =>
        setError(err.message ?? "Failed to load schedule."),
      )
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAdd = async () => {
    if (!isValidTime) {
      toast.error("Please select a valid time range.");
      return;
    }
    setSaving(true);
    try {
      const newSlot = await availabilityApi.add(startDateTime, endDateTime);
      setSlots((prev) => [...prev, newSlot]);
      setDate("");
      setStartTime("");
      setEndTime("");
      setShowForm(false);
      toast.success("Availability slot added!");
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to add slot.");
    } finally {
      setSaving(false);
    }
  };

  const freeSlots = slots;
  const bookedSlots = bookedSessions;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">
            My Schedule
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your availability for skill-sharing sessions.
          </p>
        </motion.div>

        <ErrorBanner
          error={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />

        {/* Add slot button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-6 gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90 text-white border-0 shadow-md transition-transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add Free Slot
          </Button>
        )}

        {/* Add slot form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="mb-8 p-5 md:p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-orange-400/10 border-2 border-violet-500/30 space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" /> New
                  Availability Slot
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-foreground/80">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" /> Date
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-card border-2 border-border focus-visible:border-violet-400 h-11"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={!date}
                      className="bg-card border-2 border-border focus-visible:border-orange-400 h-11 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={!date}
                      className="bg-card border-2 border-border focus-visible:border-orange-400 h-11 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {date && startTime && endTime && !isValidTime && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-destructive"
                >
                  End time must be after start time.
                </motion.p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-11 border-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={saving || !isValidTime}
                  className="flex-1 h-11 gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white border-0 disabled:opacity-40 disabled:bg-none disabled:bg-secondary disabled:text-muted-foreground"
                >
                  {saving ? (
                    "Saving…"
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Save Slot
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <div className="space-y-8">
            {/* Free slots */}
            {freeSlots.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />{" "}
                  Available Slots ({freeSlots.length})
                </p>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {freeSlots.map((slot) => (
                    <motion.div
                      key={slot.id}
                      variants={fadeUp}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-card border-2 border-border hover:border-violet-500/30 transition-colors shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        <span className="text-sm font-semibold">
                          {fmt(slot.startTime)}
                        </span>
                        <span className="text-muted-foreground text-sm hidden md:inline">
                          →
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {fmt(slot.endTime)}
                        </span>
                      </div>
                      <Badge className="bg-violet-500/10 text-violet-500 border-0 hover:bg-violet-500/20 px-3 py-1">
                        Free
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Booked slots */}
            {bookedSlots.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> Booked
                  Sessions ({bookedSlots.length})
                </p>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {bookedSlots.map((session) => (
                    <motion.div
                      key={session.id}
                      variants={fadeUp}
                      className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-orange-400/5 border-2 border-orange-400/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        <span className="text-sm font-semibold">
                          {fmt(session.startTime)}
                        </span>
                        <span className="text-muted-foreground text-sm hidden md:inline">
                          →
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {fmt(session.endTime)}
                        </span>
                      </div>
                      <Badge
                        className={`border-0 px-3 py-1 ${session.status === "ACCEPTED" ? "bg-orange-500 text-white" : "bg-orange-400/20 text-orange-500"}`}
                      >
                        {session.status}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Empty State */}
            {slots.length === 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-muted-foreground"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Clock className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-semibold text-foreground">
                  No time slots added yet
                </p>
                <p className="text-sm mt-1 max-w-xs mx-auto">
                  Add your free time so learners can start booking sessions with
                  you.
                </p>
              </motion.div>
            )}

            {/* Weekly visual Summary */}
            {freeSlots.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-card to-secondary/50 border-2 border-border mt-8"
              >
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-fuchsia-500" /> Slot Summary
                </h3>
                <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
                    <span className="text-foreground">
                      {freeSlots.length} free
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50" />
                    <span className="text-foreground">
                      {bookedSessions.length} booked
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span className="text-muted-foreground">
                      {slots.length} total
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MySchedule;
