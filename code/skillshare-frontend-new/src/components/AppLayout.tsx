import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { notificationsApi } from "@/api/notifications.api";


interface AppLayoutProps { children: React.ReactNode; }

const baseNavItems = [
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
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("skillshare-sidebar") === "true");

  useEffect(() => {
    localStorage.setItem("skillshare-sidebar", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/signup");
  };

  const navItems = user?.role === "ADMIN"
    ? [...baseNavItems, { path: "/admin", icon: ShieldCheck, label: "Admin" }]
    : baseNavItems;

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const isProfileActive = location.pathname === `/profile/${user?.id}`;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={cn("hidden md:flex flex-col border-r border-border bg-background fixed top-0 bottom-0 left-0 z-30 transition-all duration-200", isCollapsed ? "w-16" : "w-60")}>
        <div className={cn("h-14 border-b border-border flex items-center flex-shrink-0 relative", isCollapsed ? "px-0 justify-center" : "px-4 justify-between")}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
              <img src="/skillshare.png" alt="SkillShare Logo" className="w-7 h-7 object-contain flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-semibold text-base whitespace-nowrap">
                  <span className="text-foreground">Skill</span>
                  <span className="text-primary">Share</span>
                </span>
              )}
            </Link>
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={cn("flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary", isCollapsed ? "absolute -right-3 top-4 bg-background border border-border shadow-sm rounded-full z-40 w-6 h-6 flex items-center justify-center" : "")} 
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col py-3 px-2">
          <nav className="space-y-0.5" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isNotif = item.path === "/notifications";
              
              if (isCollapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-center h-10 w-10 mx-auto rounded-md text-sm font-medium transition-colors relative",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden />
                        {isNotif && unreadCount > 0 && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label} {isNotif && unreadCount > 0 && `(${unreadCount})`}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              
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

          <div className="flex-1" />

          <div className="border-t border-border pt-3 space-y-0.5">
            {user && (
              isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center h-10 w-10 mx-auto rounded-md text-xs text-muted-foreground hover:bg-secondary">
                      <Coins className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {user.credits ?? 0} credits
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Coins className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden />
                  <span className="font-medium text-foreground">{user.credits ?? 0}</span>
                  <span>credits</span>
                </div>
              )
            )}

            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to={user?.id ? `/profile/${user.id}` : "/dashboard"} aria-label="My profile" className={cn("flex items-center justify-center h-10 w-10 mx-auto rounded-md transition-colors", isProfileActive ? "bg-primary/10" : "hover:bg-secondary")}>
                    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{getInitials(user?.fullName ?? "")}</div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">My Profile</TooltipContent>
              </Tooltip>
            ) : (
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
            )}

            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button onClick={handleLogout} aria-label="Sign out" className="flex items-center justify-center h-10 w-10 mx-auto rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden />
                Sign out
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-200", isCollapsed ? "md:ml-16" : "md:ml-60")}>
        <header className="border-b border-border bg-background h-14 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center">
            {/* Mobile Logo */}
            <Link to="/dashboard" className="md:hidden flex items-center gap-2 focus:outline-none">
              <img src="/skillshare.png" alt="SkillShare Logo" className="w-7 h-7 object-contain flex-shrink-0" />
              <span className="font-semibold text-base">
                <span className="text-foreground">Skill</span>
                <span className="text-primary">Share</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit Indicator - Visible everywhere */}
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 shadow-sm">
                <Coins className="w-4 h-4" aria-hidden />
                <span>{user.credits ?? 0} <span className="hidden sm:inline">Credits</span></span>
              </div>
            )}

            {/* Profile Avatar - Mobile only since desktop has it in sidebar */}
            <Link
              to={user?.id ? `/profile/${user.id}` : "/dashboard"}
              aria-label="My profile"
              className="md:hidden"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold border border-primary/15">
                {getInitials(user?.fullName ?? "")}
              </div>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
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

        <motion.main key={location.pathname} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex-1 overflow-auto bg-background">
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;
