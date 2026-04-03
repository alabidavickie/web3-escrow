import { usePrivy } from '@privy-io/react-auth';
import { Navigate, Outlet } from 'react-router-dom';
import { useProfile, type UserRole } from '../hooks/useProfile';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

/**
 * Route guard that ensures only users with the correct role can access
 * the wrapped routes. Must be nested inside <ProtectedRoute /> so we can
 * assume the user is already authenticated and has a profile.
 */
export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = usePrivy();
  const { profile, loading } = useProfile(user?.id ?? null);

  // ProtectedRoute already handles the loading/auth spinner — just wait silently
  if (loading) return null;

  if (!profile || !allowedRoles.includes(profile.role)) {
    const roleLabel = allowedRoles.join(' or ');
    return (
      <Navigate
        to="/dashboard"
        state={{ roleError: `That page is for ${roleLabel}s only.` }}
        replace
      />
    );
  }

  return <Outlet />;
}
