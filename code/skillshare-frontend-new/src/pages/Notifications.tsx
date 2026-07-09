import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Clock, RefreshCw, Sparkles, ShieldCheck, UserPlus, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { notificationsApi, connectionsApi, type Notification, type ApiError, type ConnectionDto } from "@/lib/api";
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
  const [pendingRequests, setPendingRequests] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [data, pending] = await Promise.all([
        notificationsApi.getInbox(),
        connectionsApi.getPending().catch(() => [] as ConnectionDto[]),
      ]);
      setNotifications(data);
      setPendingRequests(pending);
    } catch (err: unknown) {
      setError((err as ApiError).message ?? "Failed to load notifications.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (conn: ConnectionDto) => {
    try {
      await connectionsApi.acceptRequest(conn.id);
      setPendingRequests(prev => prev.filter(r => r.id !== conn.id));
      toast.success(`You are now friends with ${conn.sender.fullName}!`);
    } catch {
      toast.error("Failed to accept request.");
    }
  };

  const handleDecline = async (conn: ConnectionDto) => {
    try {
      await connectionsApi.rejectRequest(conn.id);
      setPendingRequests(prev => prev.filter(r => r.id !== conn.id));
      toast.success("Request declined.");
    } catch {
      toast.error("Failed to decline request.");
    }
  };

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
                const isConnectionRequest = n.message.toLowerCase().includes("connection request");
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={async () => {
                      if (isConnectionRequest) return; // handled by buttons
                      if (!n.isRead) await markAsRead(n.id);
                      const msg = n.message.toLowerCase();
                      const tab = msg.includes("booked") || msg.includes("requested") || msg.includes("learn") ? "mentor" : "learner";
                      navigate("/sessions", { state: { tab } });
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      isConnectionRequest ? "cursor-default" : "cursor-pointer"
                    } ${
                      n.isRead ? "bg-card border-border hover:border-violet-500/30" : "bg-card border-violet-500/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                        {isConnectionRequest ? <UserPlus className="w-4 h-4" /> : cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                          {n.message}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {fmtTime(n.createdAt)}
                        </span>
                        
                        {/* Inline Accept/Decline buttons for connection requests */}
                        {isConnectionRequest && !n.isRead && pendingRequests.length > 0 && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find the pending request matching this notification
                                // Since we don't have the exact connection ID in the notification, we use the pending list
                                // Assuming the user accepts the most recent one or we just accept the first one in the pending list
                                const pending = pendingRequests[0];
                                if (pending) handleAccept(pending);
                                markAsRead(n.id);
                              }}
                              className="h-8 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 px-4"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const pending = pendingRequests[0];
                                if (pending) handleDecline(pending);
                                markAsRead(n.id);
                              }}
                              className="h-8 rounded-xl text-xs font-bold text-rose-500 border-rose-200 hover:bg-rose-50 px-4"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Decline
                            </Button>
                          </div>
                        )}
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

          {/* Friend Requests Panel */}
          {pendingRequests.length > 0 && (
            <div className="p-6 rounded-2xl bg-card border-2 border-blue-500/30 shadow-lg">
              <h4 className="font-heading font-bold mb-4 flex items-center gap-2 text-blue-600">
                <UserPlus className="w-5 h-5" /> Friend Requests
                <span className="ml-auto w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              </h4>
              <div className="space-y-4">
                {pendingRequests.map(conn => (
                  <div key={conn.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {conn.sender.profilePictureUrl
                          ? <img src={conn.sender.profilePictureUrl} alt={conn.sender.fullName} className="w-full h-full object-cover rounded-full" />
                          : conn.sender.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate capitalize">{conn.sender.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">Lvl {conn.sender.level} • {conn.sender.xp} XP</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(conn)}
                        className="flex-1 h-8 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(conn)}
                        className="flex-1 h-8 rounded-xl text-xs font-bold text-rose-500 border-rose-200 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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