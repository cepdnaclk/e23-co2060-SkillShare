import { useState, useCallback, KeyboardEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Check,
  Search,
  BookOpen,
  Clock,
  GraduationCap,
  Sparkles,
  School,
  User,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import {
  publicSkillsApi,
  userSkillsApi,
  availabilityApi,
  type Skill,
  type ApiError,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────
interface SkillEntry {
  name: string;
  type: "TEACH" | "LEARN";
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// purple + orange family only, cycled for variety
const SKILL_COLORS = [
  "bg-violet-500",
  "bg-orange-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-purple-500",
];

// ─── Skill Search with debounce ──────────────────────────────
let searchTimer: ReturnType<typeof setTimeout>;
function useSkillSearch() {
  const [results, setResults] = useState<Skill[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback((q: string) => {
    clearTimeout(searchTimer);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    searchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await publicSkillsApi.search(q);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  return { results, searching, search, clearResults: () => setResults([]) };
}

// ─── Step 1 ──────────────────────────────────────────────────
const Step1 = ({
  profile,
  setProfile,
  onNext,
}: {
  profile: { university: string; major: string; bio: string };
  setProfile: (p: typeof profile) => void;
  onNext: () => void;
}) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 24 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -24 }}
    className="space-y-6"
  >
    <div>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
        <User className="w-6 h-6 text-white" />
      </div>
      <h1 className="text-3xl font-heading font-bold mb-2">
        Tell us about yourself
      </h1>
      <p className="text-muted-foreground text-sm">
        This info appears on your public profile.
      </p>
    </div>

    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div variants={fadeUp} className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <School className="w-3.5 h-3.5 text-violet-400" /> University /
          Institution
        </Label>
        <Input
          placeholder="e.g. University of Colombo"
          value={profile.university}
          onChange={(e) =>
            setProfile({ ...profile, university: e.target.value })
          }
          className="bg-secondary border-2 border-border focus-visible:border-violet-400 h-11"
        />
      </motion.div>
      <motion.div variants={fadeUp} className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-orange-400" /> Faculty /
          Major
        </Label>
        <Input
          placeholder="e.g. Computer Science"
          value={profile.major}
          onChange={(e) => setProfile({ ...profile, major: e.target.value })}
          className="bg-secondary border-2 border-border focus-visible:border-orange-400 h-11"
        />
      </motion.div>
      <motion.div variants={fadeUp} className="space-y-1.5">
        <Label>
          Short Bio <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          placeholder="Tell others what you're passionate about…"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={3}
          className="bg-secondary border-2 border-border resize-none"
        />
      </motion.div>
    </motion.div>

    <div className="flex gap-3">
      <Button variant="outline" onClick={onNext} className="flex-1 h-11">
        Skip
      </Button>
      <Button
        onClick={onNext}
        className="flex-1 h-11 gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90 text-white border-0 disabled:opacity-40 disabled:bg-none disabled:bg-secondary disabled:text-muted-foreground"
        disabled={!profile.university}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  </motion.div>
);

// ─── Step 2 ──────────────────────────────────────────────────
const Step2 = ({
  skills,
  setSkills,
  onNext,
  onBack,
  isSaving,
}: {
  skills: SkillEntry[];
  setSkills: React.Dispatch<React.SetStateAction<SkillEntry[]>>;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<"TEACH" | "LEARN">("TEACH");
  const { results, searching, search, clearResults } = useSkillSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  const addSkill = (name: string) => {
    const exists = skills.find(
      (s) =>
        s.name.toLowerCase() === name.toLowerCase() && s.type === activeType,
    );
    if (!exists && name.trim()) {
      setSkills((prev) => [...prev, { name: name.trim(), type: activeType }]);
    }
    setQuery("");
    clearResults();
  };

  const removeSkill = (name: string, type: string) => {
    setSkills((prev) =>
      prev.filter((s) => !(s.name === name && s.type === type)),
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      addSkill(query);
    }
  };

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-heading font-bold mb-2">Your Skills</h1>
        <p className="text-muted-foreground text-sm">
          Add skills you can teach, and skills you want to learn.
        </p>
      </div>

      {/* Type toggle */}
      <div className="flex p-1 rounded-xl bg-secondary gap-1 relative">
        {(["TEACH", "LEARN"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveType(t);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className={`relative flex-1 py-2 rounded-lg text-sm font-semibold transition-colors z-10 flex items-center justify-center gap-1.5 ${
              activeType === t ? "text-white" : "text-muted-foreground"
            }`}
          >
            {activeType === t && (
              <motion.div
                layoutId="typeToggle"
                className={`absolute inset-0 rounded-lg -z-10 bg-gradient-to-r ${t === "TEACH" ? "from-violet-500 to-purple-600" : "from-orange-500 to-amber-400"}`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {t === "TEACH" ? (
              <GraduationCap className="w-4 h-4" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            {t === "TEACH" ? "I can teach" : "I want to learn"}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={`Search or type a skill to ${activeType.toLowerCase()}…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                search(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="pl-10 bg-secondary border-2 border-border h-11"
            />
          </div>
          <Button
            size="icon"
            onClick={() => addSkill(query)}
            disabled={!query.trim()}
            className="h-11 w-11 bg-gradient-to-br from-violet-500 to-orange-400 hover:opacity-90 text-white border-0 disabled:opacity-40 disabled:bg-none disabled:bg-secondary"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Dropdown results */}
        <AnimatePresence>
          {(results.length > 0 || searching) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border-2 border-border rounded-xl shadow-elevated overflow-hidden"
            >
              {searching ? (
                <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-3.5 h-3.5 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
                  />
                  Searching…
                </div>
              ) : (
                results.slice(0, 6).map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => addSkill(skill.name)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                  >
                    <span>{skill.name}</span>
                    {skill.category && (
                      <span className="text-xs text-muted-foreground">
                        {skill.category}
                      </span>
                    )}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popular Skills */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground mb-2">Popular Skills:</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "React",
            "JavaScript",
            "Python",
            "Java",
            "UI/UX Design",
            "Machine Learning",
            "Marketing",
            "SEO",
          ].map((skill, i) => (
            <motion.div
              key={skill}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Badge
                className={`cursor-pointer text-white border-0 font-medium px-2.5 ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                onClick={() => addSkill(skill)}
              >
                {skill}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Added skills */}
      <AnimatePresence>
        {skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {(["TEACH", "LEARN"] as const).map((type) => {
              const group = skills.filter((s) => s.type === type);
              if (!group.length) return null;
              return (
                <div key={type}>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {type === "TEACH" ? "Teaching" : "Learning"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <AnimatePresence>
                      {group.map((s, i) => (
                        <motion.div
                          key={s.name + s.type}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          layout
                        >
                          <Badge
                            className={`gap-1 px-3 py-1 cursor-pointer text-white border-0 ${
                              type === "TEACH"
                                ? ["bg-violet-500", "bg-purple-500"][i % 2]
                                : ["bg-orange-500", "bg-amber-500"][i % 2]
                            }`}
                            onClick={() => removeSkill(s.name, s.type)}
                          >
                            {s.name} <X className="w-3 h-3" />
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {skills.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Add at least one skill to continue
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-11 gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90 text-white border-0 disabled:opacity-40 disabled:bg-none disabled:bg-secondary disabled:text-muted-foreground"
          disabled={skills.length === 0 || isSaving}
        >
          {isSaving ? (
            "Saving…"
          ) : (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// ─── Step 3 ──────────────────────────────────────────────────
// NOTE: fixed here — previously used bg-emerald-50 / bg-white / border-emerald-200,
// which are hardcoded LIGHT colors that don't flip for dark mode. That's why the
// card and inputs looked washed-out and barely visible on a dark background.
// Now using opacity-based tints (bg-*-500/10, border-*-500/30) and theme-aware
// bg-secondary/border-border for inputs, which adapt correctly in both modes.
//
// Also restructured: date is picked once, then start/end are plain time fields
// instead of two separate full datetime pickers — clearer for a single-day slot.
const Step3 = ({
  onBack,
  onComplete,
  isSaving,
}: {
  onBack: () => void;
  onComplete: (start: string, end: string) => void;
  isSaving: boolean;
}) => {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const startDateTime = date && startTime ? `${date}T${startTime}` : "";
  const endDateTime = date && endTime ? `${date}T${endTime}` : "";
  const isValid =
    Boolean(startDateTime && endDateTime) &&
    new Date(startDateTime) < new Date(endDateTime);
  const showMismatch = Boolean(date && startTime && endTime) && !isValid;

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-6"
    >
      <div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-heading font-bold mb-2">
          Set your availability
        </h1>
        <p className="text-muted-foreground text-sm">
          Add a free time slot when you're available for skill-sharing sessions.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-orange-400/10 border-2 border-orange-400/30 space-y-5"
      >
        {/* Date */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-violet-400" /> Date
          </Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-secondary border-2 border-border focus-visible:border-violet-400 h-11"
          />
        </div>

        {/* Time slot */}
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Clock className="w-4 h-4 text-orange-400" /> Time slot
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!date}
                className="bg-secondary border-2 border-border focus-visible:border-orange-400 h-11 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!date}
                className="bg-secondary border-2 border-border focus-visible:border-orange-400 h-11 disabled:opacity-50"
              />
            </div>
          </div>
          {!date && (
            <p className="text-xs text-muted-foreground mt-2">
              Pick a date first to set your time slot.
            </p>
          )}
        </div>

        <AnimatePresence>
          {showMismatch && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive"
            >
              End time must be after start time.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-xs text-muted-foreground">
        You can skip this step and add more slots later from the Schedule page.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={() =>
            isValid
              ? onComplete(startDateTime, endDateTime)
              : onComplete("", "")
          }
          className="flex-1 h-11 gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90 text-white border-0 disabled:opacity-40 disabled:bg-none disabled:bg-secondary disabled:text-muted-foreground"
          disabled={isSaving}
        >
          {isSaving ? (
            "Setting up…"
          ) : (
            <>
              <Check className="w-4 h-4" />{" "}
              {isValid ? "Complete Setup" : "Skip for Now"}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────
const CreateProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const startStep = location.state?.startStep ?? 1;
  const [step, setStep] = useState(startStep);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileInfo, setProfileInfo] = useState({
    university: "",
    major: "",
    bio: "",
  });
  const [skills, setSkills] = useState<SkillEntry[]>([]);

  const handleSkillsNext = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await Promise.all(skills.map((s) => userSkillsApi.add(s.name, s.type)));
      setStep(3);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to save skills. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (startTime: string, endTime: string) => {
    setIsSaving(true);
    try {
      if (startTime && endTime) {
        await availabilityApi.add(startTime, endTime);
      }
      if (profileInfo.bio && user) {
        // Best-effort bio update
        try {
          await import("@/lib/api").then((m) =>
            m.usersApi.updateMyBio(profileInfo.bio),
          );
        } catch (err) {
          console.error("Failed to update bio:", err);
        }
      }
      toast.success("Profile setup complete! Welcome to SkillShare 🎉");
      navigate("/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to complete setup.");
    } finally {
      setIsSaving(false);
    }
  };

  const stepColors = [
    "from-violet-500 to-purple-600",
    "from-fuchsia-500 to-orange-400",
    "from-orange-500 to-amber-400",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-heading font-bold text-xl flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            Skill<span className="gradient-text">Share</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Step {step} of 3
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  layout
                  className={`h-1.5 rounded-full ${s <= step ? `bg-gradient-to-r ${stepColors[s - 1]}` : "bg-border"}`}
                  animate={{ width: s <= step ? 32 : 16 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-lg">
        <ErrorBanner
          error={error}
          onDismiss={() => setError(null)}
          className="mb-6"
        />
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1
              profile={profileInfo}
              setProfile={setProfileInfo}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              skills={skills}
              setSkills={setSkills}
              onNext={handleSkillsNext}
              onBack={() => setStep(1)}
              isSaving={isSaving}
            />
          )}
          {step === 3 && (
            <Step3
              onBack={() => setStep(2)}
              onComplete={handleComplete}
              isSaving={isSaving}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CreateProfile;
