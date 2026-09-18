import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Save, Shield, Lock, Bell, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";

const NOTIF_ITEMS = [
  { key: "email", label: "Email notifications", desc: "Receive important updates by email." },
  { key: "followers", label: "New followers", desc: "When someone follows your profile." },
  { key: "courses", label: "Course updates", desc: "When a course you're enrolled in adds new lessons." },
];

const PRIVACY_ITEMS = [
  { key: "publicProfile", label: "Public profile", desc: "Let other students find and view your profile." },
  { key: "openToRequests", label: "Open to session requests", desc: "Allow anyone to request a session with you." },
];

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

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
      // Mock API call to preserve existing logic
      await new Promise(res => setTimeout(res, 600));
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account preferences and settings.</p>
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
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={email} 
                    disabled 
                    className="bg-secondary/50 text-muted-foreground max-w-md cursor-not-allowed" 
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
                />
              </div>
            </div>
          </section>
          
          <hr className="border-border/60" />

          {/* Preferences Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Privacy</h2>
            </div>
            
            <div className="space-y-4 max-w-2xl">
              {PRIVACY_ITEMS.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={privacy[item.key]}
                    onCheckedChange={(v) => setPrivacy(p => ({ ...p, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Notifications Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Notifications</h2>
            </div>
            
            <div className="space-y-4 max-w-2xl">
              {NOTIF_ITEMS.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifs[item.key]}
                    onCheckedChange={(v) => setNotifs(p => ({ ...p, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Security Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Security</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="currentPw">Current password</Label>
                <div className="relative">
                  <Input
                    id="currentPw"
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="bg-background pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPw">New password</Label>
                <div className="relative">
                  <Input
                    id="newPw"
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-background pr-10"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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

          <hr className="border-border/60" />

          {/* Danger Zone */}
          <section>
            <h2 className="text-sm font-semibold tracking-wider uppercase text-red-500 mb-4">Danger Zone</h2>
            
            <div className="max-w-2xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all of your data. This cannot be undone.</p>
              </div>
              
              {!confirmingDelete ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/50 dark:hover:bg-red-950"
                >
                  Delete account
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => toast.error("Account deletion isn't wired to the API yet.")}
                  >
                    Confirm delete
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
