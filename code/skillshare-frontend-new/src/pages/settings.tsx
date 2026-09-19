import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { userSkillsApi, type UserSkill } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Moon, Sun, Monitor, Shield, Bell, Key, Plus, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SkillPickerModal } from "@/components/SkillPickerModal";
import { toast } from "sonner";
import { motion } from "framer-motion";

const normalizeSkill = (s?: string | null) => (s || "").trim().toLowerCase();

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"TEACH" | "LEARN">("TEACH");

  const fetchSkills = async () => {
    if (!user) return;
    try {
      const res = await userSkillsApi.getByUser(user.id);
      setSkills(res);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [user?.id]);

  const teachSkills = skills.filter(s => s.skillType === "TEACH");
  const learnSkills = skills.filter(s => s.skillType === "LEARN");

  const handleAddSkill = async (name: string, type: "TEACH" | "LEARN") => {
    await userSkillsApi.add(name, type);
    await fetchSkills();
    toast.success("Skill added.");
  };

  const handleRemoveSkill = async (skillId: string, skillType: string) => {
    try {
      await userSkillsApi.remove(skillId, skillType);
      await fetchSkills();
      toast.success("Skill removed.");
    } catch {
      toast.error("Failed to remove skill.");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-secondary/50 rounded-md"></div>
          <div className="h-64 bg-secondary/30 rounded-xl"></div>
          <div className="h-64 bg-secondary/30 rounded-xl"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and profile details.</p>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <div className="grid md:grid-cols-[240px_1fr] gap-8 items-start">
          
          {/* SIDE NAVIGATION (Visual only for now) */}
          <nav className="hidden md:flex flex-col gap-1 text-sm font-medium sticky top-24">
            <button className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg justify-start">
              <User className="w-4 h-4" /> Profile
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors rounded-lg justify-start">
              <Shield className="w-4 h-4" /> Security
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors rounded-lg justify-start">
              <Bell className="w-4 h-4" /> Notifications
            </button>
          </nav>

          <div className="space-y-8">
            
            {/* PROFILE DETAILS */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Profile Details</CardTitle>
                <CardDescription>
                  Your basic profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={user?.fullName || ""} 
                    disabled 
                    className="bg-secondary/30 opacity-70 cursor-not-allowed max-w-md" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Name changes are not supported.</p>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-secondary/30 opacity-70 cursor-not-allowed max-w-md" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email is linked to your authentication provider.</p>
                </div>
              </CardContent>
            </Card>

            {/* APPEARANCE */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>
                  Customize the theme of the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="gap-2"
                  >
                    <Sun className="w-4 h-4" /> Light
                  </Button>
                  <Button 
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="gap-2"
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </Button>
                  <Button 
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="gap-2"
                  >
                    <Monitor className="w-4 h-4" /> System
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SKILLS */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-lg">My Skills</CardTitle>
                <CardDescription>
                  Manage what you can teach and what you want to learn.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                
                {/* TEACH */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground tracking-tight">I Can Teach</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setPickerType("TEACH"); setPickerOpen(true); }} className="h-8 gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>

                  {teachSkills.length === 0 ? (
                    <div className="text-center py-8 bg-secondary/20 rounded-xl border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">No teaching skills added.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {teachSkills.map(skill => (
                        <motion.div key={skill.skillId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium group">
                          {skill.skillName}
                          <button 
                            onClick={() => handleRemoveSkill(skill.skillId, skill.skillType)}
                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* LEARN */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[hsl(var(--chart-4))]" />
                      <h3 className="font-semibold text-foreground tracking-tight">I Want To Learn</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setPickerType("LEARN"); setPickerOpen(true); }} className="h-8 gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>

                  {learnSkills.length === 0 ? (
                    <div className="text-center py-8 bg-secondary/20 rounded-xl border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">No learning goals added.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {learnSkills.map(skill => (
                        <motion.div key={skill.skillId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border border-[hsl(var(--chart-4))]/20 text-sm font-medium group">
                          {skill.skillName}
                          <button 
                            onClick={() => handleRemoveSkill(skill.skillId, skill.skillType)}
                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[hsl(var(--chart-4))]/20 transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      
      <SkillPickerModal 
        open={pickerOpen} 
        onOpenChange={setPickerOpen} 
        type={pickerType} 
        onAdd={handleAddSkill}
        existingTeach={teachSkills.map(s => s.skillName)}
        existingLearn={learnSkills.map(s => s.skillName)}
      />
    </AppLayout>
  );
};

export default Settings;
