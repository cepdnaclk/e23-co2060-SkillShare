import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Clock, Users, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

interface Notification {
  id: string;
  type: "match" | "message" | "reminder" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "match",
    title: "New Match!",
    message: "You matched with Sarah Chen! You both know Python and have 2 common free slots.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "New Message",
    message: "James Wilson sent you a message about collaborating on a React project.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "reminder",
    title: "Complete Your Profile",
    message: "Add more skills to get better matches with other students.",
    time: "1 day ago",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Welcome to SkillShare!",
    message: "Thanks for joining. Start by adding your skills and free time slots.",
    time: "2 days ago",
    read: true,
  },
];

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "match":
      return Sparkles;
    case "message":
      return Users;
    case "reminder":
      return Calendar;
    default:
      return Bell;
  }
};

const getIconColor = (type: Notification["type"]) => {
  switch (type) {
    case "match":
      return "bg-primary/10 text-primary";
    case "message":
      return "bg-accent/10 text-accent";
    case "reminder":
      return "bg-blue-500/10 text-blue-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="gap-2">
              <Check className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </motion.div>

        <div className="space-y-3">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          )}

          {notifications.map((notification, i) => {
            const Icon = getIcon(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  notification.read
                    ? "bg-card border-border"
                    : "bg-primary/5 border-primary/20 shadow-card"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-medium ${notification.read ? "" : "font-semibold"}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {notification.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
