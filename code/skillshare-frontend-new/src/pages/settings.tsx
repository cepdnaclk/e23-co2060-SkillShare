import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { userSkillsApi } from "@/api/userSkills.api";
import { usersApi } from "@/api/users.api";
import { type UserSkill } from "@/api/types";

import { useAuth } from "@/context/AuthContext";
import ErrorBanner from "@/components/ErrorBanner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Moon, Sun, Monitor, Plus, X, User, Camera } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SkillPickerModal } from "@/components/SkillPickerModal";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { parseAcademicBio, formatAcademicBio } from "@/lib/academicBio";

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"TEACH" | "LEARN">("TEACH");
  
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (user?.id) {
      const academic = parseAcademicBio(user.bio);
      setBio(academic.cleanBio);

      const localSaved = localStorage.getItem(`skillshare_academic_${user.id}`);
      let localParsed: { university?: string; major?: string } = {};
      if (localSaved) {
        try { localParsed = JSON.parse(localSaved); } catch {}
      }
      setUniversity(academic.university || localParsed.university || "");
      setMajor(academic.major || localParsed.major || "");
    }
  }, [user?.id, user?.bio]);

  const teachSkills = skills.filter(s => s.skillType === "TEACH");
  const learnSkills = skills.filter(s => s.skillType === "LEARN");

  const handleAddSkill = async (name: string, type: "TEACH" | "LEARN") => {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    const otherType = type === "TEACH" ? "LEARN" : "TEACH";
    const existsOther = skills.find(s => s.skillName.toLowerCase() === normalizedName.toLowerCase() && s.skillType === otherType);
    
    if (existsOther) {
      toast.error(`"${normalizedName}" is already listed under ${existsOther.skillType === "TEACH" ? "I Can Teach" : "I Want To Learn"}. You cannot teach and learn the same skill.`);
      return;
    }

    try {
      await userSkillsApi.add({ skillName: normalizedName, skillType: type, skillCategory: "User Defined" });
      await fetchSkills();
      toast.success("Skill added.");
    } catch {
      toast.error("Failed to add skill.");
    }
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

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const formattedBio = formatAcademicBio(bio, university, major);
      await usersApi.updateMyBio(formattedBio);
      if (user?.id) {
        localStorage.setItem(
          `skillshare_academic_${user.id}`,
          JSON.stringify({ university: university.trim(), major: major.trim() })
        );
        await refreshUser(user.id);
      }
      toast.success("About You details updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSavingBio(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await usersApi.uploadProfilePicture(file);
      if (user?.id) await refreshUser(user.id);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Failed to upload profile picture.");
    } finally {
      setUploading(false);
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
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and profile details.</p>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <div className="space-y-8">
          {/* PERSONAL INFORMATION */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>
                Your basic profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary border border-border flex items-center justify-center">
                    {user?.profilePictureUrl ? (
                      <img src={user.profilePictureUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/png, image/jpeg, image/jpg" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                  <Button size="icon" variant="outline" className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Camera className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground">Upload a new avatar (PNG, JPG).</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={user?.fullName || ""} 
                  disabled 
                  className="bg-secondary/30 opacity-70 cursor-not-allowed max-w-md" 
                />
                <p className="text-xs text-muted-foreground mt-1">Name changes are not supported.</p>
              </div>

            </CardContent>
          </Card>

          {/* ABOUT YOU */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg">About You</CardTitle>
              <CardDescription>
                Your bio and background.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University / Institution</Label>
                  <Input
                    id="university"
                    placeholder="e.g. Stanford University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Faculty / Major</Label>
                  <Input
                    id="major"
                    placeholder="e.g. Computer Science"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)}
                  placeholder="What are you passionate about?"
                  className="bg-background resize-none min-h-[100px]"
                />
              </div>

              <Button onClick={handleSaveBio} disabled={savingBio}>
                {savingBio ? "Saving..." : "Save Changes"}
              </Button>
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

          {/* APPEARANCE */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Customize the theme of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
