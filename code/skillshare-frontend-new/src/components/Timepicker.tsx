import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:MM" 24hr, or ""
  onChange: (value: string) => void;
  placeholder?: string;
  openDirection?: "left" | "right";
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);   // 0-59
const MERIDIEMS = ["AM", "PM"] as const;

const parse24 = (value: string) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  const meridiem: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, meridiem };
};

const to24 = (hour12: number, minute: number, meridiem: "AM" | "PM") => {
  let h = hour12 % 12;
  if (meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const displayLabel = (value: string) => {
  const parsed = parse24(value);
  if (!parsed) return null;
  return `${String(parsed.hour12).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${parsed.meridiem}`;
};

export const TimePicker = ({ value, onChange, placeholder = "--:-- --", openDirection = "left" }: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parse24(value) ?? { hour12: 12, minute: 0, meridiem: "AM" as const };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const update = (patch: Partial<{ hour12: number; minute: number; meridiem: "AM" | "PM" }>) => {
    const next = { ...parsed, ...patch };
    onChange(to24(next.hour12, next.minute, next.meridiem));
  };

  const label = displayLabel(value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full h-11 px-3.5 rounded-lg bg-secondary border-2 border-border focus-visible:border-orange-400 flex items-center justify-between text-sm transition-colors ${
          open ? "border-orange-400" : ""
        }`}
      >
        <span className={label ? "text-foreground" : "text-muted-foreground"}>{label ?? placeholder}</span>
        <Clock className="w-4 h-4 text-orange-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 top-0 w-56 p-3 rounded-2xl bg-card border-2 border-orange-400/30 shadow-2xl shadow-orange-500/10 flex gap-2 ${
              openDirection === "right" ? "left-full ml-2" : "right-full mr-2"
            }`}
          >
            {/* Hours */}
            <div className="flex-1 h-48 overflow-y-auto scroll-smooth space-y-1 pr-1">
              {HOURS.map(h => (
                <button
                  type="button"
                  key={h}
                  onClick={() => update({ hour12: h })}
                  className={`w-full py-1.5 rounded-lg text-sm text-center transition-colors ${
                    parsed.hour12 === h
                      ? "bg-gradient-to-br from-violet-500 to-orange-400 text-white font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
            {/* Minutes */}
            <div className="flex-1 h-48 overflow-y-auto scroll-smooth space-y-1 pr-1">
              {MINUTES.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => update({ minute: m })}
                  className={`w-full py-1.5 rounded-lg text-sm text-center transition-colors ${
                    parsed.minute === m
                      ? "bg-gradient-to-br from-violet-500 to-orange-400 text-white font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            {/* AM/PM */}
            <div className="flex-1 space-y-1">
              {MERIDIEMS.map(mer => (
                <button
                  type="button"
                  key={mer}
                  onClick={() => update({ meridiem: mer })}
                  className={`w-full py-1.5 rounded-lg text-sm text-center transition-colors ${
                    parsed.meridiem === mer
                      ? "bg-gradient-to-br from-violet-500 to-orange-400 text-white font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {mer}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
