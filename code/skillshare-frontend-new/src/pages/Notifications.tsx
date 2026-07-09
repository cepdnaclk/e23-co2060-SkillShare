import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Clock, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { notificationsApi, type Notification, type ApiError } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const typeConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  SESSION_BOOKED:    { bg: "bg-primary/10",    color: "text-primary", icon: <Bell className="w-4 h-4" /> },
  SESSION_ACCEPTED:  { bg: "bg-emerald-500/10", color: "text-emerald-500", icon: <Check className="w-4 h-4" /> },
  SESSION_REJECTED:  { bg: "bg-red-500/10",     color: "text-red-500", icon: <Bell className="w-4 h-4" /> },
  SYSTEM_ALERT:      { bg: "bg-amber-500/10",   color: "text-amber-500", icon: <Bell className="w-4 h-4" /> },
  FEEDBACK_RECEIVED: { bg: "bg-violet-500/10",  color: "text-violet-500", icon: <Sparkles className="w-4 h-4" /> },
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getInbox();
      setNotifications(data);
    } catch (err: unknown) {
      setError((err as ApiError).message ?? "Failed to load notifications.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error("Could not mark as read."); }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => notificationsApi.markAsRead(n.id).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read.");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 md:pb-8">
        
        {/* --- LEFT COLUMN: Main List --- */}
        <div className="flex-1 max-w-3xl w-full">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-1 mb-6 p-5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-md"
          >
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Notifications</h1>
            <p className="text-white/90 text-sm">Stay updated with your latest sessions and alerts.</p>
          </motion.div>

          <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

          {loading ? <SkeletonList count={4} /> : notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground rounded-2xl border-2 border-dashed border-border/60 bg-card">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-foreground">All caught up!</p>
              <p className="text-sm">No new notifications right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, i) => {
                const cfg = typeConfig[n.type] ?? typeConfig.SYSTEM_ALERT;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={async () => {
                      if (!n.isRead) await markAsRead(n.id);
                      const msg = n.message.toLowerCase();
                      const tab = msg.includes("booked") || msg.includes("requested") || msg.includes("learn") ? "mentor" : "learner";
                      navigate("/sessions", { state: { tab } });
                    }}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      n.isRead ? "bg-card border-border hover:border-violet-500/30" : "bg-card border-violet-500/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                          {n.message}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {fmtTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Sidebar --- */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 space-y-6">
          <div className="p-6 rounded-2xl bg-card border-2 border-border/80 shadow-lg">
            <h4 className="font-heading font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-500" /> Quick Actions
            </h4>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={load}>
                <RefreshCw className="w-4 h-4" /> Refresh Inbox
              </Button>
              {unreadCount > 0 && (
                <Button className="w-full justify-start gap-2 bg-gradient-to-r from-violet-500 to-purple-600 border-0 text-white" onClick={markAllRead}>
                  <Check className="w-4 h-4" /> Mark All Read
                </Button>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm font-semibold">{unreadCount} Unread</p>
              <p className="text-xs text-muted-foreground">Stay on top of your sessions</p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default Notifications;