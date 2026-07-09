import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const buildGrid = (viewDate: Date) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);
  return Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
  );
};

export const DatePicker = ({ value, onChange, placeholder = "mm/dd/yyyy" }: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const today = new Date();
  const grid = buildGrid(viewDate);

  const displayText = selected
    ? `${String(selected.getMonth() + 1).padStart(2, "0")}/${String(selected.getDate()).padStart(2, "0")}/${selected.getFullYear()}`
    : placeholder;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full h-11 px-3.5 rounded-lg bg-secondary border-2 border-border focus-visible:border-violet-400 flex items-center justify-between text-sm transition-colors ${
          open ? "border-violet-400" : ""
        }`}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>{displayText}</span>
        <CalendarDays className="w-4 h-4 text-violet-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-72 p-4 rounded-2xl bg-card border-2 border-violet-500/30 shadow-2xl shadow-violet-500/10"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold">{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</p>
              <button
                type="button"
                onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(w => (
                <div key={w} className="text-center text-[11px] font-medium text-muted-foreground py-1">{w}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((d, i) => {
                const inMonth = d.getMonth() === viewDate.getMonth();
                const isSelected = selected && isSameDay(d, selected);
                const isToday = isSameDay(d, today);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => { onChange(toValue(d)); setOpen(false); }}
                    className={`aspect-square rounded-lg text-xs flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-gradient-to-br from-violet-500 to-orange-400 text-white font-semibold"
                        : isToday
                        ? "border-2 border-violet-400 text-violet-400 font-medium"
                        : inMonth
                        ? "text-foreground hover:bg-secondary"
                        : "text-muted-foreground/40 hover:bg-secondary"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => { onChange(toValue(today)); setViewDate(today); setOpen(false); }}
                className="text-xs font-medium text-violet-400 hover:text-violet-300"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
