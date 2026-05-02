import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Calendar, Clock, Bell, User, LogOut, BookOpen, Layers, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { notificationsApi } from "@/lib/api";

interface AppLayoutProps { children: React.ReactNode; }

const navItems = [
  { path: "/dashboard",     icon: Home,     label: "Dashboard" },
  { path: "/search",        icon: Search,   label: "Find Mentors" },
  { path: "/sessions",      icon: Layers,   label: "Sessions" },
  { path: "/my-schedule",   icon: Calendar, label: "Schedule" },
  { path: "/notifications", icon: Bell,     label: "Notifications" },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/signup");
  };

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar (desktop) ──────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-sm fixed top-0 bottom-0 left-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 font-heading font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-black">SS</span>
            </div>
            Skill<span className="gradient-text">Share</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isNotif = item.path === "/notifications";
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isNotif && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User chip + Profile + Logout */}
        <div className="p-3 border-t border-border space-y-1">
          {/* Credits indicator */}
          {user && (
            <div className="px-4 py-2 rounded-xl bg-secondary/50 flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-medium text-foreground">{user.credits ?? 0}</span> credits
            </div>
          )}

          <Link
              to={user?.id ? `/profile/${user.id}` : "/dashboard"}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              location.pathname === "/profile/me"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {/* Mini avatar */}
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              {getInitials(user?.fullName ?? "")}
            </div>
            {user?.fullName ?? "My Profile"}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile header */}
        <header className="md:hidden border-b border-border bg-card/60 backdrop-blur-sm p-4 flex items-center justify-between sticky top-0 z-40">
          <Link to="/dashboard" className="font-heading font-bold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[9px] font-black">SS</span>
            </div>
            Skill<span className="gradient-text">Share</span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-heading font-semibold text-sm">{user.credits ?? 0}</span>
              </div>
            )}
            <Link to={user?.id ? `/profile/${user.id}` : "/dashboard"} className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                {getInitials(user?.fullName ?? "")}
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border px-2 py-2 flex justify-around z-40">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isNotif = item.path === "/notifications";
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-accent rounded-full text-[8px] flex items-center justify-center text-accent-foreground font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
