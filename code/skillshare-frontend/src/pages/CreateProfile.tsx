import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Plus, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate, Link } from "react-router-dom";

const SUGGESTED_SKILLS = [
  "Python", "JavaScript", "React", "Java", "C++", "Machine Learning",
  "Data Science", "UI/UX", "Figma", "Statistics", "TypeScript", "Node.js",
  "Photography", "Writing", "Public Speaking", "Excel", "R", "SQL",
];

const CreateProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    university: "",
    major: "",
    bio: "",
    skills: [] as string[],
    shareLocation: false,
    location: "",
  });

  const addSkill = (skill: string) => {
    if (skill.trim() && !profile.skills.includes(skill.trim())) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
    }
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput);
      setSkillInput("");
    }
  };

  const unusedSuggestions = SUGGESTED_SKILLS.filter((s) => !profile.skills.includes(s));

  const handleComplete = () => {
    // Save to localStorage for now
    localStorage.setItem("userProfile", JSON.stringify(profile));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold text-xl">
            Skill<span className="text-primary">Share</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Step {step} of 3
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="w-full h-1 bg-secondary">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <main className="container mx-auto px-6 py-12 max-w-xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2">Let's get started</h1>
                <p className="text-muted-foreground">Tell us about yourself</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Alex Johnson"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    placeholder="e.g. MIT"
                    value={profile.university}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major / Field of Study</Label>
                  <Input
                    id="major"
                    placeholder="e.g. Computer Science"
                    value={profile.major}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others a bit about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full py-6 gap-2"
                disabled={!profile.name || !profile.university}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2">Your Skills</h1>
                <p className="text-muted-foreground">What can you teach or help others with?</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => { addSkill(skillInput); setSkillInput(""); }}
                    disabled={!skillInput.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[48px]">
                  {profile.skills.map((skill) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Badge className="gap-1 px-3 py-1.5 text-sm cursor-pointer" onClick={() => removeSkill(skill)}>
                        {skill}
                        <X className="w-3 h-3" />
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                {unusedSuggestions.length > 0 && (
                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Popular skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {unusedSuggestions.slice(0, 12).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 py-6">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 py-6 gap-2"
                  disabled={profile.skills.length === 0}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2">Almost done!</h1>
                <p className="text-muted-foreground">Choose your meeting preferences</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-xl bg-secondary">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Share Location</p>
                      <p className="text-xs text-muted-foreground">Let matches see where you'd like to meet</p>
                    </div>
                  </div>
                  <Switch
                    checked={profile.shareLocation}
                    onCheckedChange={(checked) => setProfile({ ...profile, shareLocation: checked })}
                  />
                </div>

                {profile.shareLocation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label htmlFor="location">Preferred Meeting Spot</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Campus Library, Room 204"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="mt-2"
                    />
                  </motion.div>
                )}

                {/* Summary */}
                <div className="p-6 rounded-xl border border-border bg-card">
                  <h3 className="font-heading font-semibold mb-4">Profile Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{profile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">University</span>
                      <span className="font-medium">{profile.university}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Major</span>
                      <span className="font-medium">{profile.major || "Not set"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-2">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 py-6">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 py-6 gap-2">
                  Complete Setup <Check className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CreateProfile;
