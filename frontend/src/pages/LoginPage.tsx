import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

export default function LoginPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const { profile, loading } = useProfile(user?.id ?? null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (ready && !authenticated) login();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated]);

  useEffect(() => {
    if (ready && authenticated && !loading) {
      navigate(profile ? from : '/register', { replace: true });
    }
  }, [ready, authenticated, loading, profile, from, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090f] px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow">
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 1.5L2 5.25V9C2 12.45 5.08 15.67 9 16.5C12.92 15.67 16 12.45 16 9V5.25L9 1.5Z" fill="white" fillOpacity="0.9" />
            <path d="M6.5 9L8.25 10.75L11.75 7.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-50">Sign in to EscrowHub</h1>
          <p className="mt-1 text-gray-500 text-sm">Opening the sign-in window…</p>
        </div>
        <svg className="animate-spin h-5 w-5 text-brand-500 mt-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>
  );
}
