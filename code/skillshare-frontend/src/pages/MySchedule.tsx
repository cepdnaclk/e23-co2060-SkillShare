import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

interface TimeSlot {
  day: string;
  startHour: number;
  endHour: number;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

const formatHour = (h: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
};

const MySchedule = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [day, setDay] = useState(DAYS[0]);
  const [startHour, setStartHour] = useState(HOURS[0]);
  const [endHour, setEndHour] = useState(HOURS[2]);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const profile = JSON.parse(saved);
      if (profile.timeSlots) {
        setTimeSlots(profile.timeSlots);
      }
    }
  }, []);

  const saveToProfile = (slots: TimeSlot[]) => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const profile = JSON.parse(saved);
      profile.timeSlots = slots;
      localStorage.setItem("userProfile", JSON.stringify(profile));
    }
  };

  const addSlot = () => {
    if (startHour < endHour) {
      const newSlots = [...timeSlots, { day, startHour, endHour }];
      setTimeSlots(newSlots);
      saveToProfile(newSlots);
    }
  };

  const removeSlot = (index: number) => {
    const newSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(newSlots);
    saveToProfile(newSlots);
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">My Schedule</h1>
          <p className="text-muted-foreground mb-6">
            Add your free time slots for skill sharing
          </p>
        </motion.div>

        {/* Add slot form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-card border border-border mb-6"
        >
          <h3 className="font-heading font-semibold mb-4">Add Free Time</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Day</label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
              <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
              <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS.filter((h) => h > startHour).map((h) => (
                    <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addSlot} className="w-full gap-2" disabled={startHour >= endHour}>
            <Plus className="w-4 h-4" /> Add Time Slot
          </Button>
        </motion.div>

        {/* Time slots list */}
        <div className="space-y-2 mb-8">
          <AnimatePresence>
            {timeSlots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No free time slots added yet</p>
              </div>
            )}
            {timeSlots.map((slot, i) => (
              <motion.div
                key={`${slot.day}-${slot.startHour}-${slot.endHour}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium text-sm">{slot.day}</span>
                  <span className="text-muted-foreground text-sm">
                    {formatHour(slot.startHour)} — {formatHour(slot.endHour)}
                  </span>
                </div>
                <button onClick={() => removeSlot(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Visual grid */}
        {timeSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Weekly Overview
            </h3>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-8 gap-px text-xs mb-2">
                  <div />
                  {DAYS.map((d) => (
                    <div key={d} className="text-center font-medium text-muted-foreground">
                      {d.slice(0, 3)}
                    </div>
                  ))}
                </div>
                {HOURS.slice(0, 12).map((h) => (
                  <div key={h} className="grid grid-cols-8 gap-px">
                    <div className="text-xs text-muted-foreground py-1 pr-2 text-right">{formatHour(h)}</div>
                    {DAYS.map((d) => {
                      const isFree = timeSlots.some(
                        (s) => s.day === d && h >= s.startHour && h < s.endHour
                      );
                      return (
                        <div
                          key={d}
                          className={`h-6 rounded-sm transition-colors ${
                            isFree ? "bg-primary/30 border border-primary/40" : "bg-secondary/50"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default MySchedule;
