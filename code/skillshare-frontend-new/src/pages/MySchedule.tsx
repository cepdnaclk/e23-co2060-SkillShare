import { useEffect, useState } from "react";
import { Plus, X, Clock, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { availabilityApi } from "@/api/availability.api";
import { sessionsApi } from "@/api/sessions.api";
import { type Availability, type Session, type SessionStatus } from "@/api/types";
import { type ApiError } from "@/api/client";

import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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
      availabilityApi.getMyAvailabilities(),  // BUG-07: use authenticated user's own endpoint
      sessionsApi.getMentorSessions(user.id),
    ])
      .then(([slotsData, sessionsData]) => {
        setSlots(slotsData);
        setBookedSessions(sessionsData.filter((s) => s.status === "PENDING" || s.status === "ACCEPTED"));
      })
      .catch((err: ApiError) => setError((err as Error).message ?? "Could not load schedule."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      toast.error("Provide both start and end times.");
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      toast.error("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await availabilityApi.add(start.toISOString(), end.toISOString());
      toast.success("Availability added!");
      // BUG-07: refresh via authenticated endpoint, not public mentor-slots
      const freshSlots = await availabilityApi.getMyAvailabilities();
      setSlots(freshSlots);
      setShowForm(false);
      setStartTime("");
      setEndTime("");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to add slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSlot = async (id: number) => {
    try {
      await availabilityApi.delete(String(id));  // BUG-02: was remove(), API only exports delete()
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slot removed.");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to remove slot.");
    }
  };

  // Grouping slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const d = new Date(slot.startTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!acc[key]) acc[key] = { dateStr: formatDate(slot.startTime), items: [] };
    acc[key].items.push(slot);
    return acc;
  }, {} as Record<string, { dateStr: string; items: Availability[] }>);

  // Merge mapped booked sessions with grouped slots to accurately display status
  Object.values(groupedSlots).forEach((group) => {
    group.items.forEach((slot) => {
      if (slot.isBooked) {
        const matchingSession = bookedSessions.find(
          (s) => new Date(s.startTime).getTime() === new Date(slot.startTime).getTime()
        );
          if (matchingSession) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (slot as any).sessionInfo = matchingSession;
          }
      }
    });
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">My Schedule</h1>
            <p className="text-muted-foreground text-sm">Manage when you are available to teach.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="shrink-0 gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Availability"}
          </Button>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {showForm && (
          <div className="p-6 rounded-xl border border-border bg-card mb-8">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Add New Time Slot</h3>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-background border-border h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-background border-border h-10"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Save Time Slot"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4"><SkeletonList count={3} /></div>
        ) : slots.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-secondary/30 rounded-xl border border-border/50">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You haven't set any availability yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSlots)
              .sort(([keyA], [keyB]) => new Date(keyA).getTime() - new Date(keyB).getTime())
              .map(([key, group]) => (
                <div key={key}>
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 pl-1">
                    {group.dateStr}
                  </h3>
                  <div className="grid gap-3">
                    {group.items.map((slot) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const sess = (slot as any).sessionInfo as Session | undefined;
                      const status = sess ? sess.status : "FREE";
                      
                      const statusColor: Record<string, string> = {
                        FREE: "text-emerald-500",
                        PENDING: "text-amber-500",
                        ACCEPTED: "text-primary",
                      };
                      const badgeClass = statusColor[status] ?? "text-muted-foreground";

                      return (
                        <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/60 bg-card gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-semibold text-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </span>
                              <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-secondary ${badgeClass}`}>
                                {status}
                              </span>
                            </div>
                            
                            {sess && (
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" />
                                <span>Session requested by <strong className="font-medium text-foreground">{sess.learnerName}</strong></span>
                              </div>
                            )}
                          </div>
                          
                          <div className="shrink-0">
                            {!slot.isBooked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveSlot(slot.id)}
                                className="h-8 text-xs text-red-500 hover:text-red-600 border-border/60 hover:border-red-200 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MySchedule;
