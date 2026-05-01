import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { TimeSlot } from "@/hooks/useSkillShare";

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  onAdd: (slot: TimeSlot) => void;
  onRemove: (index: number) => void;
  days: string[];
  hours: number[];
}

const formatHour = (h: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
};

const TimeSlotPicker = ({ timeSlots, onAdd, onRemove, days, hours }: TimeSlotPickerProps) => {
  const [day, setDay] = useState(days[0]);
  const [startHour, setStartHour] = useState(hours[0]);
  const [endHour, setEndHour] = useState(hours[2]);

  const handleAdd = () => {
    if (startHour < endHour) {
      onAdd({ day, startHour, endHour });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-bold mb-1">Your Availability</h2>
        <p className="text-muted-foreground">Add your free time slots so we can find common availability.</p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Day</label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {days.map((d) => (
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
                {hours.map((h) => (
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
                {hours.filter((h) => h > startHour).map((h) => (
                  <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full gap-2" disabled={startHour >= endHour}>
          <Plus className="w-4 h-4" /> Add Time Slot
        </Button>
      </div>

      {/* Time slots list */}
      <div className="space-y-2">
        <AnimatePresence>
          {timeSlots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No time slots added yet</p>
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
              <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Visual grid */}
      {timeSlots.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-8 gap-px text-xs">
              <div />
              {days.map((d) => (
                <div key={d} className="text-center font-medium text-muted-foreground py-2">
                  {d.slice(0, 3)}
                </div>
              ))}
            </div>
            {hours.slice(0, 12).map((h) => (
              <div key={h} className="grid grid-cols-8 gap-px">
                <div className="text-xs text-muted-foreground py-1 pr-2 text-right">{formatHour(h)}</div>
                {days.map((d) => {
                  const isBooked = timeSlots.some(
                    (s) => s.day === d && h >= s.startHour && h < s.endHour
                  );
                  return (
                    <div
                      key={d}
                      className={`h-6 rounded-sm transition-colors ${
                        isBooked ? "bg-primary/20 border border-primary/30" : "bg-secondary/50"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TimeSlotPicker;
