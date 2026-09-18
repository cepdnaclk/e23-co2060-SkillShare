import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Shield, Lock, AlertTriangle, Trash2, Save, Eye, EyeOff, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
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

const SETTINGS_TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  const [activeTab, setActiveTab] = useState("account");

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

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
      await new Promise(res => setTimeout(res, 600));
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account preferences and settings.
            </p>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="gap-2 rounded-lg"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Settings Sidebar Nav */}
          <nav className="w-full md:w-64 flex flex-col gap-1 flex-shrink-0 sticky top-24">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Settings Content Area */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit="exit"
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* ── ACCOUNT TAB ── */}
                {activeTab === "account" && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <h2 className="text-lg font-semibold mb-1">Profile Information</h2>
                      <p className="text-sm text-muted-foreground">This information is shown on your public profile.</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Full name</Label>
                          <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-secondary/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={email} disabled className="bg-secondary opacity-60" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="bg-secondary/50 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── NOTIFICATIONS TAB ── */}
                {activeTab === "notifications" && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <h2 className="text-lg font-semibold mb-1">Notification Preferences</h2>
                      <p className="text-sm text-muted-foreground">Decide what you want to be notified about.</p>
                    </div>
                    
                    <div className="p-6 divide-y divide-border">
                      {NOTIF_ITEMS.map(item => (
                        <div key={item.key} className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                          <div className="pr-4">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notifs[item.key]}
                            onCheckedChange={(v) => setNotifs(p => ({ ...p, [item.key]: v }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PRIVACY & SECURITY TAB ── */}
                {activeTab === "privacy" && (
                  <div className="space-y-6">
                    {/* Privacy */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="p-6 border-b border-border">
                        <h2 className="text-lg font-semibold mb-1">Privacy</h2>
                        <p className="text-sm text-muted-foreground">Control who can see your profile and reach you.</p>
                      </div>
                      <div className="p-6 divide-y divide-border">
                        {PRIVACY_ITEMS.map(item => (
                          <div key={item.key} className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                            <div className="pr-4">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                            <Switch
                              checked={privacy[item.key]}
                              onCheckedChange={(v) => setPrivacy(p => ({ ...p, [item.key]: v }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="p-6 border-b border-border">
                        <h2 className="text-lg font-semibold mb-1">Change Password</h2>
                        <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
                      </div>
                      <div className="p-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Current password</Label>
                            <div className="relative">
                              <Input
                                type={showCurrent ? "text" : "password"}
                                value={currentPw}
                                onChange={(e) => setCurrentPw(e.target.value)}
                                className="bg-secondary/50 pr-10"
                              />
                              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>New password</Label>
                            <div className="relative">
                              <Input
                                type={showNew ? "text" : "password"}
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="bg-secondary/50 pr-10"
                              />
                              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
                      <div className="p-6 border-b border-destructive/10">
                        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" /> Danger Zone
                        </h2>
                      </div>
                      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Delete Account</p>
                          <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all data.</p>
                        </div>
                        
                        {!confirmingDelete ? (
                          <Button
                            variant="destructive"
                            onClick={() => setConfirmingDelete(true)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" /> Delete account
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                            <Button
                              variant="destructive"
                              onClick={() => toast.error("Account deletion isn't wired to the API yet.")}
                              className="gap-2"
                            >
                              Confirm delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── APPEARANCE TAB ── */}
                {activeTab === "appearance" && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <h2 className="text-lg font-semibold mb-1">Theme</h2>
                      <p className="text-sm text-muted-foreground">Customize how SkillShare looks on your device.</p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setTheme("light")}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                            !isDark ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
                          )}
                        >
                          <div className="w-24 h-16 rounded-md bg-[#FAFAFA] border shadow-sm flex items-center justify-center">
                            <div className="w-12 h-2 rounded bg-indigo-500/20" />
                          </div>
                          <span className="text-sm font-medium">Light Mode</span>
                        </button>
                        
                        <button
                          onClick={() => setTheme("dark")}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                            isDark ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
                          )}
                        >
                          <div className="w-24 h-16 rounded-md bg-[#0A0A0A] border shadow-sm flex items-center justify-center">
                            <div className="w-12 h-2 rounded bg-indigo-500/50" />
                          </div>
                          <span className="text-sm font-medium">Dark Mode</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
