import { useState, useCallback, KeyboardEvent, useRef } from "react";
import { Search, X, Check, ArrowRight, User, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { publicSkillsApi, userSkillsApi, availabilityApi, type Skill, type ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { DatePicker } from "@/components/DatePicker";
import { TimePicker } from "@/components/TimePicker";

interface SkillEntry { name: string; type: "TEACH" | "LEARN"; }

// "?"?"? Skill Search with debounce "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
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

// "?"?"? Sub-component: Skill Input "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
const SkillSection = ({ 
  type, 
  title, 
  description, 
  skills, 
  onAdd, 
  onRemove 
}: {
  type: "TEACH" | "LEARN";
  title: string;
  description: string;
  skills: SkillEntry[];
  onAdd: (name: string, type: "TEACH" | "LEARN") => void;
  onRemove: (name: string, type: "TEACH" | "LEARN") => void;
}) => {
  const [query, setQuery] = useState("");
  const { results, searching, search, clearResults } = useSkillSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (name: string) => {
    if (name.trim()) {
      onAdd(name.trim(), type);
      setQuery("");
      clearResults();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      handleAdd(query);
    }
  };

  const currentSkills = skills.filter(s => s.type === type);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-semibold">{title}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={`Search or type a skill to ${type.toLowerCase()}...`}
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          onKeyDown={handleKeyDown}
          className="pl-10 bg-background"
        />
        
        {/* Autocomplete Dropdown */}
        {query && (results.length > 0 || searching) && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {searching ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
            ) : (
              results.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleAdd(r.name)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center justify-between"
                >
                  <span className="font-medium text-foreground">{r.name}</span>
                  {r.category && <span className="text-xs text-muted-foreground">{r.category}</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {currentSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {currentSkills.map(s => (
            <Badge key={s.name} variant={type === "TEACH" ? "secondary" : "outline"} className="gap-1 px-2.5 py-1 text-sm font-medium">
              {s.name}
              <button onClick={() => onRemove(s.name, type)} className="hover:bg-muted-foreground/20 rounded-full p-0.5 ml-1">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// "?"?"? Main Form "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
const CreateProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileInfo, setProfileInfo] = useState({ university: "", major: "", bio: "" });
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleAddSkill = (name: string, type: "TEACH" | "LEARN") => {
    const exists = skills.find(s => s.name.toLowerCase() === name.toLowerCase() && s.type === type);
    if (!exists) setSkills(prev => [...prev, { name, type }]);
  };

  const handleRemoveSkill = (name: string, type: "TEACH" | "LEARN") => {
    setSkills(prev => prev.filter(s => !(s.name === name && s.type === type)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const teachSkills = skills.filter(s => s.type === "TEACH");
    const learnSkills = skills.filter(s => s.type === "LEARN");
    if (teachSkills.length === 0 && learnSkills.length === 0) {
      setError("Please add at least one skill to teach or learn.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const startDateTime = date && startTime ? `${date}T${startTime}` : "";
    const endDateTime = date && endTime ? `${date}T${endTime}` : "";
    if (startDateTime && endDateTime && new Date(startDateTime) >= new Date(endDateTime)) {
      setError("End time must be after start time.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Best-effort bio update
      if (profileInfo.bio && user) {
        try { await import("@/lib/api").then(m => m.usersApi.updateMyBio(profileInfo.bio)); } catch (err) { console.error("Failed to update bio:", err); }
      }

      // Add skills
      await Promise.all(skills.map(s => userSkillsApi.add(s.name, s.type)));

      // Add availability if provided
      if (startDateTime && endDateTime) {
        await availabilityApi.add(startDateTime, endDateTime);
      }
      
      toast.success("Profile setup complete!");
      navigate("/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to complete setup.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">Complete your profile</h1>
          <p className="text-muted-foreground text-sm">Tell us about yourself and what you want to share.</p>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-8" />

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* 1. Bio */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">About You</h2>
            </div>
            
            <div className="space-y-4 bg-card border border-border/60 p-6 rounded-2xl shadow-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University / Institution</Label>
                  <Input
                    id="university"
                    placeholder="e.g. Stanford University"
                    value={profileInfo.university}
                    onChange={(e) => setProfileInfo({ ...profileInfo, university: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Faculty / Major</Label>
                  <Input
                    id="major"
                    placeholder="e.g. Computer Science"
                    value={profileInfo.major}
                    onChange={(e) => setProfileInfo({ ...profileInfo, major: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="What are you passionate about?"
                  value={profileInfo.bio}
                  onChange={(e) => setProfileInfo({ ...profileInfo, bio: e.target.value })}
                  rows={3}
                  className="bg-background resize-none"
                />
              </div>
            </div>
          </section>

          {/* 2. Skills */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Your Skills</h2>
            </div>

            <div className="space-y-8 bg-card border border-border/60 p-6 rounded-2xl shadow-sm">
              <SkillSection
                type="TEACH"
                title="I can teach"
                description="Skills you are comfortable sharing with others."
                skills={skills}
                onAdd={handleAddSkill}
                onRemove={handleRemoveSkill}
              />
              
              <div className="border-t border-border/50" />

              <SkillSection
                type="LEARN"
                title="I want to learn"
                description="Skills you are currently looking to develop."
                skills={skills}
                onAdd={handleAddSkill}
                onRemove={handleRemoveSkill}
              />
            </div>
          </section>

          {/* 3. Availability */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Initial Availability</h2>
              </div>
              <span className="text-xs text-muted-foreground sm:pl-0 pl-10">Optional. You can add more later.</span>
            </div>

            <div className="space-y-5 bg-card border border-border/60 p-6 rounded-2xl shadow-sm">
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <TimePicker value={startTime} onChange={setStartTime} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <TimePicker value={endTime} onChange={setEndTime} openDirection="left" />
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-6 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Complete Setup"} <Check className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateProfile;
