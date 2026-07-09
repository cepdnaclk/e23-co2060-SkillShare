import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import CreateProfile from "./pages/CreateProfile";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import ViewProfile from "./pages/ViewProfile";
import MySchedule from "./pages/MySchedule";
import Notifications from "./pages/Notifications";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import OAuth2RedirectHandler from "@/components/OAuth2RedirectHandler";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Fixed, click-through gradient wash that sits ABOVE every page's own
// (opaque) background div, so the violet/orange glow is visible on
// every route regardless of what bg-* class that page's root div uses.
const GradientOverlay = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[60]"
    style={{ backgroundImage: "var(--gradient-glow)" }}
  />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner richColors position="top-right" />
        <GradientOverlay />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />

            {/* GitHub OAuth2 redirect handler — must be public (not behind ProtectedRoute)
                because the JWT arrives here for the first time and auth state is not yet set. */}
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            {/* Protected routes */}
            <Route path="/create-profile" element={
              <ProtectedRoute><CreateProfile /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute><Search /></ProtectedRoute>
            } />
            <Route path="/profile/:id" element={
              <ProtectedRoute><ViewProfile /></ProtectedRoute>
            } />
            <Route path="/profile/me" element={
              <ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>
            } />
            <Route path="/my-schedule" element={
              <ProtectedRoute><MySchedule /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute><Sessions /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><Leaderboard /></ProtectedRoute>
            } />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </ChatProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
