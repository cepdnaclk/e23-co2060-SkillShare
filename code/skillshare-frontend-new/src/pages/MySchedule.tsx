import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/AppLayout";
import {availabilityApi, type Availability, type ApiError, myavailabilityApi} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import {Badge} from "@/components/ui/badge.tsx";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const MySchedule = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Availability[]>([]);
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

    availabilityApi.getMentorSlots(user.id)
        .then(setSlots)
        .catch((err: ApiError) => setError(err.message ?? "Failed to load availability."))
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
      toast.success("Availability slot added!");
    } catch (err: unknown) {
      const e = err as ApiError;
      toast.error(e.message ?? "Failed to add slot.");
    } finally { setSaving(false); }
  };

  const freeSlots = slots.filter(s => !s.isBooked);
  const bookedSlots = slots.filter(s => s.isBooked);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">My Schedule</h1>
          <p className="text-muted-foreground text-sm mb-6">Manage your availability for skill-sharing sessions.</p>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {/* Add slot button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-6 gap-2">
            <Plus className="w-4 h-4" /> Add Free Slot
          </Button>
        )}

        {/* Add slot form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">New Availability Slot</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="bg-secondary border-border h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="bg-secondary border-border h-11"
                  />
                </div>
              </div>
              {startTime && endTime && new Date(startTime) >= new Date(endTime) && (
                <p className="text-xs text-destructive mb-3">End time must be after start time.</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={saving || !startTime || !endTime} className="gap-2">
                  {saving ? "Saving…" : <><Plus className="w-4 h-4" /> Add Slot</>}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <div className="space-y-6">
            {/* Free slots */}
            {freeSlots.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Available Slots ({freeSlots.length})</p>
                <div className="space-y-2">
                  {freeSlots.map(slot => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-sm font-medium">{fmt(slot.startTime)}</span>
                        <span className="text-muted-foreground text-sm">→ {fmt(slot.endTime)}</span>
                      </div>
                      <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">Free</Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Booked slots */}
            {bookedSlots.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Booked Slots ({bookedSlots.length})</p>
                <div className="space-y-2">
                  {bookedSlots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border opacity-70">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-sm font-medium">{fmt(slot.startTime)}</span>
                        <span className="text-muted-foreground text-sm">→ {fmt(slot.endTime)}</span>
                      </div>
                      <Badge className="status-pending text-xs">Booked</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slots.length === 0 && !showForm && (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No time slots added yet</p>
                <p className="text-sm mt-1">Add your free time so learners can book sessions with you.</p>
              </div>
            )}

            {/* Weekly visual */}
            {freeSlots.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Slot Summary
                </h3>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-muted-foreground">{freeSlots.length} free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="text-muted-foreground">{bookedSlots.length} booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-border" />
                    <span className="text-muted-foreground">{slots.length} total</span>
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
