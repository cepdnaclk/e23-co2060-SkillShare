import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Calendar,
  Bell,
  LogOut,
  Layers,
  Coins,
  Settings as SettingsIcon,
  Trophy,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { notificationsApi } from "@/lib/api";

interface AppLayoutProps { children: React.ReactNode; }

const navItems = [
  { path: "/dashboard",     icon: Home,         label: "Dashboard" },
  { path: "/search",        icon: Search,       label: "Explore" },
  { path: "/sessions",      icon: Layers,       label: "Sessions" },
  { path: "/my-schedule",   icon: Calendar,     label: "Schedule" },
  { path: "/leaderboard",   icon: Trophy,       label: "Leaderboard" },
  { path: "/notifications", icon: Bell,         label: "Notifications" },
  { path: "/settings",      icon: SettingsIcon, label: "Settings" },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/signup");
  };

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const isProfileActive = location.pathname === `/profile/${user?.id}`;

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar (desktop) ──────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-background fixed top-0 bottom-0 left-0 z-30">

        {/* Wordmark */}
        <div className="h-14 px-4 border-b border-border flex items-center flex-shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </Link>
        </div>

        {/* Scrollable nav + bottom section */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col py-3 px-2">

          {/* Main navigation */}
          <nav className="space-y-0.5" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isNotif = item.path === "/notifications";
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                  {item.label}
                  {isNotif && unreadCount > 0 && (
                    <span
                      className="ml-auto min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold px-1"
                      aria-label={`${unreadCount} unread notifications`}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom: credits + profile + sign out */}
          <div className="border-t border-border pt-3 space-y-0.5">

            {/* Credits chip */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Coins className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden />
                <span className="font-medium text-foreground">{user.credits ?? 0}</span>
                <span>credits</span>
              </div>
            )}

            {/* Profile link */}
            <Link
              to={user?.id ? `/profile/${user.id}` : "/dashboard"}
              aria-current={isProfileActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isProfileActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div
                className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                aria-hidden
              >
                {getInitials(user?.fullName ?? "")}
              </div>
              <span className="truncate">{user?.fullName ?? "My Profile"}</span>
            </Link>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-60 min-w-0">

        {/* Mobile header */}
        <header className="md:hidden border-b border-border bg-background h-14 px-4 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">

          {/* Mobile wordmark */}
          <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </Link>

          {/* Mobile right controls */}
          <div className="flex items-center gap-2">
            {/* Credits */}
            {user && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="w-3.5 h-3.5" aria-hidden />
                <span className="font-medium text-foreground">{user.credits ?? 0}</span>
              </div>
            )}

            {/* Avatar */}
            <Link
              to={user?.id ? `/profile/${user.id}` : "/dashboard"}
              aria-label="My profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold border border-primary/15">
                {getInitials(user?.fullName ?? "")}
              </div>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile slide-out menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            {/* Panel */}
            <nav
              className="relative ml-auto w-64 h-full bg-background border-l border-border flex flex-col py-4 px-3 shadow-lg"
              aria-label="Mobile navigation"
            >
              <div className="space-y-0.5 flex-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isNotif = item.path === "/notifications";
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 relative",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                      {item.label}
                      {isNotif && unreadCount > 0 && (
                        <span
                          className="ml-auto min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold px-1"
                          aria-label={`${unreadCount} unread notifications`}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom actions */}
              <div className="border-t border-border pt-3 space-y-0.5">
                <Link
                  to={user?.id ? `/profile/${user.id}` : "/dashboard"}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0" aria-hidden>
                    {getInitials(user?.fullName ?? "")}
                  </div>
                  <span className="truncate">{user?.fullName ?? "My Profile"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden />
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  );
};

export default AppLayout;