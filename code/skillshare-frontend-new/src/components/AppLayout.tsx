import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Calendar, Bell, LogOut, Layers, Coins } from "lucide-react";
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

/* ─── Ambient orb environment — shared across the app ─────── */
export const GlassOrbs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
    {/* Violet — top-left */}
    <div
      className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] rounded-full animate-drift-slow"
      style={{ background: "radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 70%)", filter: "blur(80px)" }}
    />
    {/* Fuchsia — bottom-right */}
    <div
      className="absolute -bottom-[15%] -right-[8%] w-[550px] h-[550px] rounded-full animate-drift-medium"
      style={{ background: "radial-gradient(circle, rgba(192,38,211,0.22) 0%, transparent 70%)", filter: "blur(90px)" }}
    />
    {/* Orange — mid-right */}
    <div
      className="absolute top-[35%] right-[15%] w-[380px] h-[380px] rounded-full animate-drift-fast"
      style={{ background: "radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 70%)", filter: "blur(100px)" }}
    />
  </div>
);

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
    <div className="relative min-h-screen bg-[#0A0A0C] flex">
      {/* ── Ambient glass orbs ───────────────────────── */}
      <GlassOrbs />

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 z-30
        bg-white/[0.03] backdrop-blur-2xl border-r border-white/8
        supports-[backdrop-filter]:bg-black/20">

        {/* Logo */}
        <div className="p-6 border-b border-white/8">
          <Link to="/dashboard" className="flex items-center gap-2.5 font-heading font-bold text-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white text-xs font-black">SS</span>
            </div>
            <span className="text-white/90">Skill<span className="gradient-text">Share</span></span>
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
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                  isActive
                    ? "bg-white/15 text-white backdrop-blur-sm border border-white/20 shadow-sm"
                    : "text-white/50 hover:text-white/85 hover:bg-white/6"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isNotif && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center font-bold shadow-lg shadow-violet-500/40">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User chip + Profile + Logout */}
        <div className="p-3 border-t border-white/8 space-y-1">
          {/* Credits indicator */}
          {user && (
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2 text-xs text-white/50 mb-2">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-semibold text-white/80">{user.credits ?? 0}</span> credits
            </div>
          )}

          <Link
            to={user?.id ? `/profile/${user.id}` : "/dashboard"}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              location.pathname.startsWith("/profile")
                ? "bg-white/15 text-white border border-white/20"
                : "text-white/50 hover:text-white/85 hover:bg-white/6"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/20 text-white/80 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              {getInitials(user?.fullName ?? "")}
            </div>
            <span className="truncate">{user?.fullName ?? "My Profile"}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-64 relative z-10">

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40
          bg-black/50 backdrop-blur-2xl border-b border-white/8
          supports-[backdrop-filter]:bg-black/30 p-4 flex items-center justify-between">
          <Link to="/dashboard" className="font-heading font-bold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-black">SS</span>
            </div>
            <span className="text-white/90">Skill<span className="gradient-text">Share</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/10">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-heading font-semibold text-sm text-white/80">{user.credits ?? 0}</span>
              </div>
            )}
            <Link to={user?.id ? `/profile/${user.id}` : "/dashboard"}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/20 text-white flex items-center justify-center text-xs font-bold">
                {getInitials(user?.fullName ?? "")}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40
          bg-black/60 backdrop-blur-2xl border-t border-white/8
          supports-[backdrop-filter]:bg-black/40 px-2 py-2 flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isNotif = item.path === "/notifications";
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] transition-all relative",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-violet-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
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
