import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Check, Clock, RefreshCw, 
  CalendarCheck, CheckCircle2, XCircle, MessageSquare, Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { notificationsApi, type Notification, type ApiError } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ─── Animation Variants ──────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// ─── Type Configuration ──────────────────────────────────────
const typeConfig: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  SESSION_BOOKED:   { bg: "bg-violet-500/10",   color: "text-violet-500",   icon: CalendarCheck },
  SESSION_ACCEPTED: { bg: "bg-emerald-500/10",  color: "text-emerald-500",  icon: CheckCircle2 },
  SESSION_REJECTED: { bg: "bg-red-500/10",      color: "text-red-500",      icon: XCircle },
  FEEDBACK_RECEIVED:{ bg: "bg-orange-500/10",   color: "text-orange-500",   icon: MessageSquare },
  SYSTEM_ALERT:     { bg: "bg-muted",           color: "text-muted-foreground", icon: Info },
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const load = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await notificationsApi.getInbox();
      setNotifications(data);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load notifications.");
    } finally { 
      setLoading(false); 
      setIsRefreshing(false);
    }
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between mb-8">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
                </span>
              ) : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => load(true)} 
              title="Refresh"
              className="hover:bg-secondary rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-violet-500" : ""}`} />
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllRead} 
                className="gap-2 border-2 border-border hover:border-violet-500/30 hover:text-violet-500 transition-colors rounded-xl h-10"
              >
                <Check className="w-4 h-4" /> <span className="hidden md:inline">Mark all read</span>
              </Button>
            )}
          </div>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {loading ? (
          <SkeletonList count={4} />
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
             <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
               <Bell className="w-8 h-8 opacity-40" />
             </div>
            <p className="font-semibold text-foreground">No notifications yet</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">We'll notify you when someone books a session or leaves feedback.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((n) => {
                const cfg = typeConfig[n.type] ?? typeConfig.SYSTEM_ALERT;
                const Icon = cfg.icon;
                const isUnread = !n.isRead;

                return (
                  <motion.div
                    key={n.id}
                    variants={fadeUp}
                    layout
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={async () => {
                      if (isUnread) await markAsRead(n.id);
                      
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
                        message.includes("link") ||
                        message.includes("your session request");

                      const tab = isMentorNotification ? "mentor" : isLearnerNotification ? "learner" : null;
                      if (tab) navigate("/sessions", { state: { tab } });
                    }}
                    className={`p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-colors relative overflow-hidden group ${
                      isUnread
                        ? "bg-card border-violet-500/30 shadow-sm shadow-violet-500/5 hover:border-violet-500/50"
                        : "bg-card/50 border-border hover:border-foreground/20"
                    }`}
                  >
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm md:text-base leading-snug ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground font-medium"}`}>
                            {n.message}
                          </p>
                        </div>
                        <span className={`text-xs flex items-center gap-1.5 ${isUnread ? "text-violet-500/80 font-medium" : "text-muted-foreground"}`}>
                          <Clock className="w-3.5 h-3.5" /> {fmtTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;