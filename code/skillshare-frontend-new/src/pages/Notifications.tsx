import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Check, Clock, RefreshCw,
  CalendarCheck, CheckCircle2, XCircle, MessageSquare, Info
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { notificationsApi, type Notification, type ApiError } from "@/lib/api";
import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ─── Spring preset ──────────────────────────────────────── */
const spring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 };

/* ─── Animation Variants ─────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

/* ─── Type Configuration ─────────────────────────────────── */
const typeConfig: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  SESSION_BOOKED:    { bg: "bg-violet-500/10",   color: "text-violet-400",  icon: CalendarCheck },
  SESSION_ACCEPTED:  { bg: "bg-emerald-500/10",  color: "text-emerald-400", icon: CheckCircle2 },
  SESSION_REJECTED:  { bg: "bg-red-500/10",      color: "text-red-400",     icon: XCircle },
  FEEDBACK_RECEIVED: { bg: "bg-orange-500/10",   color: "text-orange-400",  icon: MessageSquare },
  SYSTEM_ALERT:      { bg: "bg-white/5",         color: "text-white/50",    icon: Info },
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
      <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}
          className="flex items-end justify-between mb-8">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white mb-1">Notifications</h1>
            <p className="text-white/45 text-sm">
              {unreadCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
                </span>
              ) : "All caught up!"}
            </p>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={spring}
              onClick={() => load(true)}
              title="Refresh"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-violet-400" : ""}`} />
            </motion.button>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
                onClick={markAllRead}
                className="flex items-center gap-2 px-3 h-9 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 text-sm font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mark all read</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

        {loading ? (
          <SkeletonList count={4} />
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-white/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Bell className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-semibold text-white/60">No notifications yet</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">We'll notify you when someone books a session or leaves feedback.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
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
                    transition={spring}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (isUnread) await markAsRead(n.id);
                      const message = n.message.toLowerCase();
                      const isMentorNotification =
                        message.includes("booked") || message.includes("requested") ||
                        message.includes("wants to learn") || message.includes("learn from you") ||
                        message.includes("your mentoring");
                      const isLearnerNotification =
                        message.includes("accepted") || message.includes("rejected") ||
                        message.includes("completed") || message.includes("link") ||
                        message.includes("your session request");
                      const tab = isMentorNotification ? "mentor" : isLearnerNotification ? "learner" : null;
                      if (tab) navigate("/sessions", { state: { tab } });
                    }}
                    className={`p-4 md:p-5 rounded-2xl border cursor-pointer relative overflow-hidden group transition-colors ${
                      isUnread
                        ? "bg-white/8 border-violet-500/25 hover:border-violet-500/40 shadow-sm shadow-violet-500/5"
                        : "bg-white/[0.03] border-white/8 hover:bg-white/6 hover:border-white/15"
                    }`}
                  >
                    {/* Unread accent bar */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                    )}

                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} border border-white/8 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm md:text-base leading-snug mb-1.5 ${isUnread ? "font-semibold text-white/90" : "text-white/55 font-medium"}`}>
                          {n.message}
                        </p>
                        <span className={`text-xs flex items-center gap-1.5 ${isUnread ? "text-violet-400/80 font-medium" : "text-white/30"}`}>
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