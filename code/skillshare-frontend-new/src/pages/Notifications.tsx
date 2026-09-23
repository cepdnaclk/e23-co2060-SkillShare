import { useEffect, useState } from "react";
import { Bell, Check, Sparkles, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { notificationsApi } from "@/api/notifications.api";
import { connectionsApi } from "@/api/connections.api";
import { type Notification, type ConnectionDto } from "@/api/types";
import { type ApiError } from "@/api/client";

import { SkeletonList } from "@/components/SkeletonCard";
import ErrorBanner from "@/components/ErrorBanner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const typeConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  SESSION_BOOKED:    { icon: <Bell className="w-3.5 h-3.5 text-foreground" />, bg: "bg-secondary" },
  SESSION_ACCEPTED:  { icon: <Check className="w-3.5 h-3.5 text-foreground" />, bg: "bg-secondary" },
  SESSION_REJECTED:  { icon: <X className="w-3.5 h-3.5 text-foreground" />, bg: "bg-secondary" },
  SYSTEM_ALERT:      { icon: <Bell className="w-3.5 h-3.5 text-foreground" />, bg: "bg-secondary" },
  FEEDBACK_RECEIVED: { icon: <Sparkles className="w-3.5 h-3.5 text-foreground" />, bg: "bg-secondary" },
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
  const [friends, setFriends] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const [data, pending, fData] = await Promise.all([
        notificationsApi.getInbox(),
        connectionsApi.getPending().catch(() => [] as ConnectionDto[]),
        connectionsApi.getFriends().catch(() => [] as ConnectionDto[]),
      ]);
      setNotifications(data);
      setPendingRequests(pending);
      setFriends(fData);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to load notifications.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (conn: ConnectionDto) => {
    try {
      await connectionsApi.acceptRequest(conn.id);
      setPendingRequests(prev => prev.filter(r => r.id !== conn.id));
      toast.success(`Connected with ${conn.sender.fullName}.`);
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
    } catch { 
      toast.error("Could not mark as read."); 
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    await Promise.all(unread.map(n => notificationsApi.markAsRead(n.id).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("Marked all as read.");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground text-sm">Stay updated with your latest activity.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="shrink-0 h-8 text-xs">
              Mark all as read
            </Button>
          )}
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-6" />

        {loading ? (
          <div className="space-y-4"><SkeletonList count={4} /></div>
        ) : (
          <div className="space-y-12">
            
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
                  Connection Requests ({pendingRequests.length})
                </h2>
                <div className="grid gap-3">
                  {pendingRequests.map(conn => (
                    <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/60 rounded-xl bg-card gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium text-foreground shrink-0 border border-border/50">
                          {conn.sender.profilePictureUrl ? (
                            <img src={conn.sender.profilePictureUrl} alt={conn.sender.fullName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(conn.sender.fullName)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{conn.sender.fullName}</p>
                          <p className="text-xs text-muted-foreground">wants to connect</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleDecline(conn)} className="h-8 text-xs hover:text-red-500 hover:border-red-200">
                          Decline
                        </Button>
                        <Button size="sm" onClick={() => handleAccept(conn)} className="h-8 text-xs">
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notifications List */}
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">Recent</h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50">
                  You're all caught up.
                </p>
              ) : (
                <div className="grid gap-3">
                  {notifications.map(n => {
                    const cfg = typeConfig[n.type] ?? typeConfig.SYSTEM_ALERT;
                    const isConnectionRequest = n.message.toLowerCase().includes("connection request");
                    return (
                      <button
                        key={n.id}
                        onClick={async () => {
                          if (!n.isRead) await markAsRead(n.id);
                          const msg = n.message.toLowerCase();
                          if (msg.includes("sent you a connection request")) {
                            const name = n.message.split(" sent you")[0].trim();
                            const p = pendingRequests.find(c => c.sender.fullName === name);
                            if (p) {
                              navigate(`/profile/${p.sender.id}`);
                              return;
                            }
                            const f = friends.find(c => c.sender.fullName === name || c.receiver.fullName === name);
                            if (f && user) {
                              const otherId = f.sender.id === user.id ? f.receiver.id : f.sender.id;
                              navigate(`/profile/${otherId}`);
                            }
                          } else if (msg.includes("accepted your connection request")) {
                            const name = n.message.split(" accepted")[0].trim();
                            const f = friends.find(c => c.sender.fullName === name || c.receiver.fullName === name);
                            if (f && user) {
                              const otherId = f.sender.id === user.id ? f.receiver.id : f.sender.id;
                              navigate(`/profile/${otherId}`);
                            }
                          } else {
                            const tab = msg.includes("booked") || msg.includes("requested") || msg.includes("learn") ? "mentor" : "learner";
                            navigate("/sessions", { state: { tab } });
                          }
                        }}
                        className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border border-border/60 transition-colors ${
                          n.isRead ? "bg-card hover:bg-secondary/40 opacity-70" : "bg-card shadow-sm border-foreground/10"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 border border-border/50`}>
                          {isConnectionRequest ? <UserPlus className="w-3.5 h-3.5 text-foreground" /> : cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-sm leading-relaxed mb-1 ${n.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                            {n.message}
                          </p>
                          <span className="text-xs text-muted-foreground/70">
                            {fmtTime(n.createdAt)}
                          </span>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-foreground shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
