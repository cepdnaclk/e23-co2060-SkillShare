import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

interface Props { children: React.ReactNode; }

const ProtectedRoute = ({ children }: Props) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
