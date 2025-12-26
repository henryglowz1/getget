import { Navigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
