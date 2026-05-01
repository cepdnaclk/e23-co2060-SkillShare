import { useState, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Plus, Check, Search, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { publicSkillsApi, userSkillsApi, availabilityApi, type Skill, type ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────
interface SkillEntry { name: string; type: "TEACH" | "LEARN"; }

// ─── Skill Search with debounce ──────────────────────────────
let searchTimer: ReturnType<typeof setTimeout>;
function useSkillSearch() {
  const [results, setResults] = useState<Skill[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback((q: string) => {
    clearTimeout(searchTimer);
    if (!q.trim()) { setResults([]); return; }
    searchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await publicSkillsApi.search(q);
        setResults(res);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  return { results, searching, search, clearResults: () => setResults([]) };
}

// ─── Step 1 ──────────────────────────────────────────────────
const Step1 = ({ profile, setProfile, onNext }: {
  profile: { university: string; major: string; bio: string };
  setProfile: (p: typeof profile) => void;
  onNext: () => void;
}) => (
  <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
    <div>
      <h1 className="text-3xl font-heading font-bold mb-2">Tell us about yourself</h1>
      <p className="text-muted-foreground text-sm">This info appears on your public profile.</p>
    </div>
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>University / Institution</Label>
        <Input
          placeholder="e.g. University of Colombo"
          value={profile.university}
          onChange={(e) => setProfile({ ...profile, university: e.target.value })}
          className="bg-secondary border-border h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Faculty / Major</Label>
        <Input
          placeholder="e.g. Computer Science"
          value={profile.major}
          onChange={(e) => setProfile({ ...profile, major: e.target.value })}
          className="bg-secondary border-border h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Short Bio <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          placeholder="Tell others what you're passionate about…"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={3}
          className="bg-secondary border-border resize-none"
        />
      </div>
    </div>
    <Button onClick={onNext} className="w-full h-11 gap-2" disabled={!profile.university}>
      Continue <ArrowRight className="w-4 h-4" />
    </Button>
  </motion.div>
);

// ─── Step 2 ──────────────────────────────────────────────────
const Step2 = ({ skills, setSkills, onNext, onBack, isSaving }: {
  skills: SkillEntry[];
  setSkills: React.Dispatch<React.SetStateAction<SkillEntry[]>>;
  onNext: () => void;
  onBack: () => void;
  isSaving: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<"TEACH" | "LEARN">("TEACH");
  const { results, searching, search, clearResults } = useSkillSearch();

  const addSkill = (name: string) => {
    const exists = skills.find(s => s.name.toLowerCase() === name.toLowerCase() && s.type === activeType);
    if (!exists && name.trim()) {
      setSkills(prev => [...prev, { name: name.trim(), type: activeType }]);
    }
    setQuery(""); clearResults();
  };

  const removeSkill = (name: string, type: string) => {
    setSkills(prev => prev.filter(s => !(s.name === name && s.type === type)));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) { e.preventDefault(); addSkill(query); }
  };

  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Your Skills</h1>
        <p className="text-muted-foreground text-sm">Add skills you can teach, and skills you want to learn.</p>
      </div>

      {/* Type toggle */}
      <div className="flex p-1 rounded-xl bg-secondary gap-1">
        {(["TEACH", "LEARN"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === t ? "bg-card text-foreground shadow" : "text-muted-foreground"
            }`}
          >
            {t === "TEACH" ? "🎓 I can teach" : "📚 I want to learn"}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search or type a skill to ${activeType.toLowerCase()}…`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
              onKeyDown={handleKeyDown}
              className="pl-10 bg-secondary border-border h-11"
            />
          </div>
          <Button size="icon" variant="outline" onClick={() => addSkill(query)} disabled={!query.trim()} className="h-11 w-11">
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
              className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden"
            >
              {searching ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
              ) : (
                results.slice(0, 6).map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => addSkill(skill.name)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                  >
                    <span>{skill.name}</span>
                    {skill.category && <span className="text-xs text-muted-foreground">{skill.category}</span>}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Added skills */}
      {skills.length > 0 && (
        <div className="space-y-2">
          {(["TEACH", "LEARN"] as const).map(type => {
            const group = skills.filter(s => s.type === type);
            if (!group.length) return null;
            return (
              <div key={type}>
                <p className="text-xs text-muted-foreground mb-1.5">{type === "TEACH" ? "Teaching" : "Learning"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.map(s => (
                    <Badge key={s.name + s.type} className={`gap-1 px-3 py-1 cursor-pointer ${type === "TEACH" ? "bg-primary/15 text-primary hover:bg-primary/25 border-primary/20" : "bg-accent/15 text-accent hover:bg-accent/25 border-accent/20"} border`}
                      onClick={() => removeSkill(s.name, s.type)}
                    >
                      {s.name} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {skills.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Add at least one skill to continue
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} className="flex-1 h-11 gap-2" disabled={skills.length === 0 || isSaving}>
          {isSaving ? "Saving…" : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </motion.div>
  );
};

// ─── Step 3 ──────────────────────────────────────────────────
const Step3 = ({ onBack, onComplete, isSaving }: {
  onBack: () => void;
  onComplete: (start: string, end: string) => void;
  isSaving: boolean;
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const isValid = startTime && endTime && new Date(startTime) < new Date(endTime);

  return (
    <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Set your availability</h1>
        <p className="text-muted-foreground text-sm">Add a free time slot when you're available for skill-sharing sessions.</p>
      </div>

      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <Clock className="w-4 h-4 text-primary" /> Add your first availability slot
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-secondary border-border h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-secondary border-border h-11"
            />
          </div>
        </div>
        {startTime && endTime && !isValid && (
          <p className="text-xs text-destructive">End time must be after start time.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        You can skip this step and add more slots later from the Schedule page.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={() => isValid ? onComplete(startTime, endTime) : onComplete("", "")}
          className="flex-1 h-11 gap-2"
          disabled={isSaving}
        >
          {isSaving ? "Setting up…" : <><Check className="w-4 h-4" /> {isValid ? "Complete Setup" : "Skip for Now"}</>}
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

  const [profileInfo, setProfileInfo] = useState({ university: "", major: "", bio: "" });
  const [skills, setSkills] = useState<SkillEntry[]>([]);

  const handleSkillsNext = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await Promise.all(
        skills.map(s => userSkillsApi.add(s.name, s.type))
      );
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
        try { await import("@/lib/api").then(m => m.usersApi.updateMyBio(profileInfo.bio)); } catch (err) {console.error("Failed to update bio:", err);}
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold text-xl">
            Skill<span className="gradient-text">Share</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "bg-primary w-8" : "bg-border w-4"}`} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-lg">
        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />
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
