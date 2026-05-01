import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { StudentProfile } from "@/hooks/useSkillShare";

interface ProfileFormProps {
  profile: StudentProfile;
  onUpdate: (updates: Partial<StudentProfile>) => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
}

const SUGGESTED_SKILLS = [
  "Python", "JavaScript", "React", "Java", "C++", "Machine Learning",
  "Data Science", "UI/UX", "Figma", "Statistics", "TypeScript", "Node.js",
  "Photography", "Writing", "Public Speaking", "Excel", "R", "SQL",
];

const ProfileForm = ({ profile, onUpdate, onAddSkill, onRemoveSkill }: ProfileFormProps) => {
  const [skillInput, setSkillInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      onAddSkill(skillInput);
      setSkillInput("");
    }
  };

  const unusedSuggestions = SUGGESTED_SKILLS.filter((s) => !profile.skills.includes(s));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-heading font-bold mb-1">Your Profile</h2>
        <p className="text-muted-foreground">Tell us about yourself and your skills.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="e.g. Alex Johnson"
            value={profile.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="university">University</Label>
          <Input
            id="university"
            placeholder="e.g. MIT"
            value={profile.university}
            onChange={(e) => onUpdate({ university: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="major">Major</Label>
          <Input
            id="major"
            placeholder="e.g. Computer Science"
            value={profile.major}
            onChange={(e) => onUpdate({ major: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Short Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell others about yourself..."
            value={profile.bio}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            className="resize-none h-10"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <Label>Skills</Label>
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
            onClick={() => { onAddSkill(skillInput); setSkillInput(""); }}
            disabled={!skillInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge className="gap-1 px-3 py-1.5 text-sm cursor-pointer" onClick={() => onRemoveSkill(skill)}>
                  {skill}
                  <X className="w-3 h-3" />
                </Badge>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {unusedSuggestions.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {unusedSuggestions.slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  onClick={() => onAddSkill(skill)}
                  className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Location sharing */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
        <div>
          <p className="font-medium text-sm">Share Location</p>
          <p className="text-xs text-muted-foreground">Let matches see where you'd like to meet</p>
        </div>
        <Switch
          checked={profile.shareLocation}
          onCheckedChange={(checked) => onUpdate({ shareLocation: checked })}
        />
      </div>

      {profile.shareLocation && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Input
            placeholder="e.g. Campus Library, Room 204"
            value={profile.location || ""}
            onChange={(e) => onUpdate({ location: e.target.value })}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileForm;
