import { useState, useEffect } from "react";
import { Save, User, X, Plus, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usersApi, userSkillsApi, trendingApi, type UserSkill, type TrendingSkillDto } from "@/lib/api";

const normalizeSkill = (s: string) => s.trim().toLowerCase();

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [saving, setSaving] = useState(false);
  
  // Skills State
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkillDto[]>([]);
  
  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");
  const [skillLoading, setSkillLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setBio(user.bio ?? "");
      fetchSkills();
    }
  }, [user]);
  
  useEffect(() => {
    trendingApi.getTopSharingSkills()
      .then(res => setTrendingSkills(res))
      .catch(() => {});
  }, []);

  const fetchSkills = async () => {
    if (!user) return;
    try {
      const res = await userSkillsApi.getByUser(user.id);
      setSkills(res);
    } catch {
      toast.error("Failed to load skills.");
    }
  };

  const teachSkills = skills.filter(s => s.skillType === "TEACH");
  const learnSkills = skills.filter(s => s.skillType === "LEARN");

  const handleAddSkill = async (name: string, type: "TEACH" | "LEARN") => {
    if (!name.trim()) return;
    const normalized = normalizeSkill(name);
    
    // Check conflicts
    const oppositeType = type === "TEACH" ? "LEARN" : "TEACH";
    const oppositeSkills = type === "TEACH" ? learnSkills : teachSkills;
    
    if (oppositeSkills.some(s => normalizeSkill(s.skillName) === normalized)) {
      toast.error(`You cannot add "${name.trim()}" to ${type === "TEACH" ? "Teach" : "Learn"} because it is already in your ${oppositeType === "TEACH" ? "Teach" : "Learn"} list.`);
      return;
    }
    
    const sameList = type === "TEACH" ? teachSkills : learnSkills;
    if (sameList.some(s => normalizeSkill(s.skillName) === normalized)) {
      toast.error(`You already added "${name.trim()}".`);
      return;
    }

    setSkillLoading(true);
    try {
      await userSkillsApi.add(name.trim(), type);
      await fetchSkills();
      if (type === "TEACH") setTeachInput("");
      else setLearnInput("");
      toast.success("Skill added.");
    } catch {
      toast.error("Failed to add skill.");
    } finally {
      setSkillLoading(false);
    }
  };

  const handleRemoveSkill = async (id: string, type: string) => {
    try {
      await userSkillsApi.remove(id, type);
      setSkills(skills.filter(s => s.id !== id));
      toast.success("Skill removed.");
    } catch {
      toast.error("Failed to remove skill.");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (bio !== user?.bio) {
        await usersApi.updateMyBio(bio);
        await refreshUser();
      }
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account preferences and skills.</p>
          </div>
          <Button onClick={handleSaveAll} disabled={saving} className="shrink-0 gap-2 h-9 text-xs">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-12">
          
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Account</h2>
            </div>
            
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    disabled
                    className="bg-secondary/50 max-w-md cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground">Name change is not currently supported.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={email} 
                    disabled 
                    className="bg-secondary/50 max-w-md cursor-not-allowed text-muted-foreground" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="bg-background resize-none max-w-2xl"
                  placeholder="Write a short bio about yourself..."
                />
              </div>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Skills Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Skills</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
              {/* TEACH SKILLS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap className="w-4 h-4" />
                  <h3 className="font-medium text-sm">I can teach</h3>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={teachInput}
                    onChange={(e) => setTeachInput(e.target.value)}
                    placeholder="e.g. React, Guitar, Spanish..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill(teachInput, "TEACH")}
                  />
                  <Button disabled={!teachInput.trim() || skillLoading} onClick={() => handleAddSkill(teachInput, "TEACH")} variant="secondary" size="icon" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {trendingSkills.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recommended</p>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingSkills.slice(0, 5).map(ts => {
                        const isConflict = learnSkills.some(s => normalizeSkill(s.skillName) === normalizeSkill(ts.name));
                        const isAdded = teachSkills.some(s => normalizeSkill(s.skillName) === normalizeSkill(ts.name));
                        return (
                          <Badge 
                            key={`teach-trend-${ts.name}`} 
                            variant="outline" 
                            className={`cursor-pointer transition-colors ${isConflict ? "opacity-50 cursor-not-allowed" : isAdded ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-secondary"}`}
                            onClick={() => {
                              if (!isConflict && !isAdded) handleAddSkill(ts.name, "TEACH");
                            }}
                          >
                            {ts.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50">
                  {teachSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 bg-secondary/20 rounded-md border border-dashed border-border">No skills added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {teachSkills.map(skill => (
                        <Badge key={skill.id} variant="default" className="pl-3 pr-1 py-1 gap-1 flex items-center bg-primary text-primary-foreground">
                          {skill.skillName}
                          <button onClick={() => handleRemoveSkill(skill.id!, "TEACH")} className="hover:bg-background/20 p-0.5 rounded-full transition-colors" aria-label="Remove skill">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LEARN SKILLS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[hsl(var(--chart-4))]">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="font-medium text-sm">I want to learn</h3>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={learnInput}
                    onChange={(e) => setLearnInput(e.target.value)}
                    placeholder="e.g. Machine Learning, Piano..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill(learnInput, "LEARN")}
                  />
                  <Button disabled={!learnInput.trim() || skillLoading} onClick={() => handleAddSkill(learnInput, "LEARN")} variant="secondary" size="icon" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {trendingSkills.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recommended</p>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingSkills.slice(0, 5).map(ts => {
                        const isConflict = teachSkills.some(s => normalizeSkill(s.skillName) === normalizeSkill(ts.name));
                        const isAdded = learnSkills.some(s => normalizeSkill(s.skillName) === normalizeSkill(ts.name));
                        return (
                          <Badge 
                            key={`learn-trend-${ts.name}`} 
                            variant="outline" 
                            className={`cursor-pointer transition-colors ${isConflict ? "opacity-50 cursor-not-allowed" : isAdded ? "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20" : "hover:bg-secondary"}`}
                            onClick={() => {
                              if (!isConflict && !isAdded) handleAddSkill(ts.name, "LEARN");
                            }}
                          >
                            {ts.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50">
                  {learnSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 bg-secondary/20 rounded-md border border-dashed border-border">No skills added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {learnSkills.map(skill => (
                        <Badge key={skill.id} variant="secondary" className="pl-3 pr-1 py-1 gap-1 flex items-center bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] hover:bg-[hsl(var(--chart-4))]/25 border-0">
                          {skill.skillName}
                          <button onClick={() => handleRemoveSkill(skill.id!, "LEARN")} className="hover:bg-background/20 p-0.5 rounded-full transition-colors" aria-label="Remove skill">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Appearance Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Appearance</h2>
            </div>
            
            <div className="flex items-center justify-between gap-4 py-1 max-w-2xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Dark mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle dark and light themes.</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              />
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
