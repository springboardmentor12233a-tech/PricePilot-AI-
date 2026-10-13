import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="text-sm text-slate-500 mt-1">
          Your role ({user.role}) doesn't have permission to view this page.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
