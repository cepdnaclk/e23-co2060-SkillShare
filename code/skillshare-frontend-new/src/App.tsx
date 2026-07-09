import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />

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
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
