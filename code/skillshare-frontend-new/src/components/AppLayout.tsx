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
  BookOpen,
  Bookmark,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { notificationsApi } from "@/api/notifications.api";

interface AppLayoutProps { children: React.ReactNode; }

const navItems = [
  { path: "/dashboard",     icon: Home,         label: "Dashboard" },
  { path: "/search",        icon: Search,       label: "Explore Skills" },
  { path: "/sessions",      icon: Layers,       label: "My Skills" },
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
      <aside className="hidden md:flex flex-col w-[240px] border-r border-sidebar-border bg-sidebar fixed top-0 bottom-0 left-0 z-30">

        {/* Logo & Tagline */}
        <div className="px-5 pt-6 pb-4 flex-shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              <span className="text-foreground">Skill</span>
              <span className="text-primary">Share</span>
            </span>
          </Link>
          <p className="text-[11px] text-muted-foreground mt-1.5 ml-[42px] leading-tight">
            Learn. Teach. Grow Together.
          </p>
        </div>

        {/* Scrollable nav + bottom section */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col px-3">

          {/* Main navigation */}
          <nav className="space-y-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isNotif = item.path === "/notifications";
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
                  {item.label}
                  {isNotif && unreadCount > 0 && (
                    <span
                      className="ml-auto min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold px-1.5"
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

          {/* Motivational sidebar banner */}
          <div className="mx-1 mb-4 rounded-xl overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, hsl(245 58% 96%) 0%, hsl(270 80% 96%) 50%, hsl(245 58% 93%) 100%)",
            }}
          >
            <div className="px-4 py-5">
              <p className="text-sm font-semibold text-foreground italic leading-snug mb-1">
                Better Skills<br />Brighter Days.
              </p>
              <ArrowUpRight className="w-4 h-4 text-primary mt-1" />
            </div>
          </div>

          {/* Request a Session CTA */}
          <div className="px-1 mb-3">
            <button
              onClick={() => navigate("/search")}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Request a Session
            </button>
          </div>

          {/* Bottom: credits + profile + sign out */}
          <div className="border-t border-sidebar-border pt-3 pb-4 space-y-1">

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
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isProfileActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div
                className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden />
              Sign out
            </button>
          </div>

          {/* Version */}
          <p className="text-[10px] text-muted-foreground/50 px-3 pb-3">
            SkillShare v1.0.0
          </p>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-[240px] min-w-0">

        {/* Desktop top bar */}
        <div className="hidden md:block sticky top-4 z-20 px-6 w-full max-w-6xl mx-auto">
          <header className="flex items-center justify-between h-14 px-5 rounded-2xl border border-border bg-card shadow-sm">
            {/* Search bar */}
            <button
              onClick={() => navigate("/search")}
              className="flex items-center gap-2.5 h-9 px-4 w-full max-w-sm rounded-lg border border-transparent bg-secondary/50 text-muted-foreground text-sm hover:border-primary/20 hover:bg-secondary transition-colors"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span>Search for skills, people, or topics...</span>
            </button>

          {/* Right controls */}
          <div className="flex items-center gap-3 ml-4">
            {/* Notification bell */}
            <Link
              to="/notifications"
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-semibold px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User profile */}
            <Link
              to={user?.id ? `/profile/${user.id}` : "/dashboard"}
              className="flex items-center gap-2.5 h-10 pl-2 pr-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold border border-primary/10">
                {getInitials(user?.fullName ?? "")}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
                  {user?.fullName ?? "User"}
                </p>
                {user?.university && (
                  <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">
                    {user.university}
                  </p>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
            </Link>
          </div>
        </header>
        </div>

        {/* Mobile header */}
        <header className="md:hidden border-b border-border bg-background h-14 px-4 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">

          {/* Mobile wordmark */}
          <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
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

            {/* Notification bell */}
            <Link to="/notifications" className="relative w-8 h-8 flex items-center justify-center" aria-label="Notifications">
              <Bell className="w-4.5 h-4.5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center font-semibold px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <Link
              to={user?.id ? `/profile/${user.id}` : "/dashboard"}
              aria-label="My profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold border border-primary/10">
                {getInitials(user?.fullName ?? "")}
              </div>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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
              className="relative ml-auto w-72 h-full bg-card border-l border-border flex flex-col py-4 px-3 shadow-xl"
              aria-label="Mobile navigation"
            >
              <div className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isNotif = item.path === "/notifications";
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden />
                      {item.label}
                      {isNotif && unreadCount > 0 && (
                        <span
                          className="ml-auto min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold px-1.5"
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
              <div className="border-t border-border pt-3 space-y-1">
                <Link
                  to={user?.id ? `/profile/${user.id}` : "/dashboard"}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0" aria-hidden>
                    {getInitials(user?.fullName ?? "")}
                  </div>
                  <span className="truncate">{user?.fullName ?? "My Profile"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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