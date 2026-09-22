import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  if (requiredRole && (isLoading || !user?.role)) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
