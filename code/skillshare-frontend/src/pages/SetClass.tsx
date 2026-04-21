import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  day: string;
  startHour: number;
  endHour: number;
  location: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

const formatHour = (h: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
};

const SetClass = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    day: DAYS[0],
    startHour: 9,
    endHour: 10,
    location: "",
  });

  const addClass = () => {
    if (form.name && form.startHour < form.endHour) {
      setClasses((prev) => [
        ...prev,
        { ...form, id: Date.now().toString() },
      ]);
      setForm({ name: "", code: "", day: DAYS[0], startHour: 9, endHour: 10, location: "" });
      setShowForm(false);
    }
  };

  const removeClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Your Classes</h1>
          <p className="text-muted-foreground mb-6">
            Add your class schedule to help us find your free time
          </p>
        </motion.div>

        {/* Add class button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-6 gap-2">
            <Plus className="w-4 h-4" /> Add Class
          </Button>
        )}

        {/* Add class form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold">New Class</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    placeholder="e.g. Introduction to AI"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classCode">Course Code</Label>
                  <Input
                    id="classCode"
                    placeholder="e.g. CS 101"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Room 301"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={String(form.startHour)} onValueChange={(v) => setForm({ ...form, startHour: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select value={String(form.endHour)} onValueChange={(v) => setForm({ ...form, endHour: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HOURS.filter((h) => h > form.startHour).map((h) => (
                        <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addClass} disabled={!form.name || form.startHour >= form.endHour}>
                  Add Class
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Classes list */}
        <div className="space-y-3">
          {classes.length === 0 && !showForm && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No classes added yet</p>
            </div>
          )}

          {classes.map((cls) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cls.code && `${cls.code} • `}{cls.day} • {formatHour(cls.startHour)} - {formatHour(cls.endHour)}
                    {cls.location && ` • ${cls.location}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeClass(cls.id)}
                className="text-muted-foreground hover:text-destructive p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default SetClass;
