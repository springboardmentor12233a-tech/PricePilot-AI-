import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/authentication/hooks/useAuth';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { APP_CONFIG } from '../utils/constants';

/**
 * ProtectedRoute Component
 * Guards all internal application views against unauthorized access.
 * Displays a full-screen loading state during startup verification.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, error, loadCurrentUser } = useAuth();
  const location = useLocation();

  // 1. Initial application startup auth check running
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 antialiased"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* Logo Mark */}
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs mb-5 relative">
            <TrendingUp className="w-6 h-6" />
            <span className="absolute -inset-1 rounded-2xl border-2 border-[#2563EB]/40 animate-ping" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
            Loading your workspace…
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Verifying your security credentials with {APP_CONFIG.name}.
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs text-[#94A3B8]">
            <div className="w-4 h-4 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
            <span>Connecting to FastAPI gateway</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: redirect to /login with previous location state
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Authenticated session verified: render route outlet
  return <Outlet />;
}
