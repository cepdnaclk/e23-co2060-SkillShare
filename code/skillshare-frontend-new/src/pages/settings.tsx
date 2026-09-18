import { useState, useEffect } from "react";
import { Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { usersApi } from "@/lib/api";

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

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
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account preferences.</p>
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
                    className="bg-secondary/50 max-w-md cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">Name change is not currently supported.</p>
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
