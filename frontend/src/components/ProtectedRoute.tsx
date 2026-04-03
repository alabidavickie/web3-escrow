import { usePrivy } from '@privy-io/react-auth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

export default function ProtectedRoute() {
  const { ready, authenticated, user } = usePrivy();
  const { profile, loading } = useProfile(user?.id ?? null);
  const location = useLocation();

  // Still loading privy or profile
  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090f]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-7 w-7 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but no profile AND not already on register → go to register
  if (!profile && location.pathname !== '/register') {
    return <Navigate to="/register" replace />;
  }

  // On /register but profile already exists → go to dashboard
  if (profile && location.pathname === '/register') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
