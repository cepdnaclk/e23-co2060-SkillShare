import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { notificationsApi, type Notification, type ApiError } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const typeConfig: Record<string, { bg: string; color: string }> = {
  SESSION_BOOKED:   { bg: "bg-primary/10",  color: "text-primary" },
  SESSION_ACCEPTED: { bg: "bg-emerald-500/10", color: "text-emerald-400" },
  SESSION_REJECTED: { bg: "bg-red-500/10",   color: "text-red-400" },
  SYSTEM_ALERT:     { bg: "bg-muted",        color: "text-muted-foreground" },
  FEEDBACK_RECEIVED:{ bg: "bg-accent/10",    color: "text-accent" },
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
      const e = err as ApiError;
      setError(e.message ?? "Failed to load notifications.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error("Could not mark as read.");
    }
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
      <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={load} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
                <Check className="w-4 h-4" /> Mark all read
              </Button>
            )}
          </div>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {loading ? (
          <SkeletonList count={4} />
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">We'll notify you when something happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const cfg = typeConfig[n.type] ?? typeConfig.SYSTEM_ALERT;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={async () => {
                    if (!n.isRead) {
                      await markAsRead(n.id);
                    }
                    console.log("notification type:", n.type, "message:", n.message);
                    const message = n.message.toLowerCase();

                    const isMentorNotification =
                        message.includes("booked") ||
                        message.includes("requested") ||
                        message.includes("wants to learn") ||
                        message.includes("learn from you") ||
                        message.includes("your mentoring");

                    const isLearnerNotification =
                        message.includes("accepted") ||
                        message.includes("rejected") ||
                        message.includes("completed") ||
                        message.includes("your session request");

                    const tab = isMentorNotification ? "mentor" : "learner";



                    navigate("/sessions", { state: { tab } });
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    n.isRead
                      ? "bg-card border-border"
                      : "bg-primary/5 border-primary/20 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Bell className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                          {n.message}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(n.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
