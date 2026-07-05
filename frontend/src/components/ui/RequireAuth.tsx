import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function RequireAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="center-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
