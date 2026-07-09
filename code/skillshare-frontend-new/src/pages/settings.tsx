import { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Home, Settings as SettingsIcon, Moon, Sun,
  Lock, Shield, AlertTriangle, Trash2, Save, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const NOTIF_ITEMS = [
  { key: "email",     label: "Email notifications", desc: "Receive important updates by email." },
  { key: "followers",  label: "New followers",       desc: "When someone follows your profile." },
  { key: "courses",    label: "Course updates",      desc: "When a course you're enrolled in adds new lessons." },
];

const PRIVACY_ITEMS = [
  { key: "publicProfile",  label: "Public profile",           desc: "Let other students find and view your profile." },
  { key: "openToRequests", label: "Open to session requests", desc: "Allow anyone to request a session with you." },
];

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  const [fullName, setFullName] = useState(user?.fullName ?? "Alex Johnson");
  const [email] = useState(user?.email ?? "alex@example.com");
  const [bio, setBio] = useState(user?.bio ?? "Lifelong learner. I teach guitar and web design.");

  const [notifs, setNotifs] = useState<Record<string, boolean>>({ email: true, followers: true, courses: true });
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({ publicProfile: true, openToRequests: true });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // TODO: wire these up to your real endpoints, e.g.:
      // await usersApi.updateProfile({ fullName, bio });
      // await usersApi.updateNotificationPrefs(notifs);
      // await usersApi.updatePrivacyPrefs(privacy);
      // if (currentPw && newPw) await usersApi.changePassword({ currentPw, newPw });
      await new Promise(res => setTimeout(res, 600));
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* Top nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold text-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            Skill<span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">Share</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-orange-400 text-white">
              <SettingsIcon className="w-4 h-4" /> Settings
            </div>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1"
              aria-label="Toggle theme"
            >
              {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

          {/* Profile */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card border-2 border-border">
            <h2 className="text-lg font-heading font-semibold mb-1">Profile</h2>
            <p className="text-sm text-muted-foreground mb-5">This information is shown on your public profile.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary border-2 border-border focus-visible:border-violet-400 h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} disabled className="bg-secondary border-2 border-border h-11 opacity-60" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="bg-secondary border-2 border-border focus-visible:border-violet-400 resize-none"
              />
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card border-2 border-border">
            <h2 className="text-lg font-heading font-semibold mb-1">Notifications</h2>
            <p className="text-sm text-muted-foreground mb-5">Decide what you want to be notified about.</p>

            <div className="divide-y divide-border">
              {NOTIF_ITEMS.map(item => (
                <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifs[item.key]}
                    onCheckedChange={(v) => setNotifs(p => ({ ...p, [item.key]: v }))}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-orange-400" />
              <h2 className="text-lg font-heading font-semibold">Privacy</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Control who can see your profile and reach you.</p>

            <div className="divide-y divide-border">
              {PRIVACY_ITEMS.map(item => (
                <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={privacy[item.key]}
                    onCheckedChange={(v) => setPrivacy(p => ({ ...p, [item.key]: v }))}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-amber-400"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-violet-400" />
              <h2 className="text-lg font-heading font-semibold">Password</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Update your password to keep your account secure.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="bg-secondary border-2 border-border pr-10 h-11"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-secondary border-2 border-border pr-10 h-11"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="text-lg font-heading font-semibold text-destructive">Danger zone</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all of your data.</p>

            {!confirmingDelete ? (
              <Button
                onClick={() => setConfirmingDelete(true)}
                className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 text-white border-0"
              >
                <Trash2 className="w-4 h-4" /> Delete account
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => toast.error("Account deletion isn't wired to the API yet.")}
                  className="gap-2 bg-destructive hover:bg-destructive/90 text-white border-0"
                >
                  <Trash2 className="w-4 h-4" /> Confirm delete
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Floating save button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90 text-white border-0 shadow-xl shadow-violet-500/30"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </motion.div>
    </div>
  );
};

export default Settings;
