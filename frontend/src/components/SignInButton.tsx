import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

interface SignInButtonProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function shortAddress(addr: string) {
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function SignInButton({ variant = 'light', size = 'md', className = '' }: SignInButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const navigate = useNavigate();

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const googleAccount = user?.linkedAccounts?.find((a: { type: string }) => a.type === 'google_oauth') as
    | { type: 'google_oauth'; name: string | null; email: string } | undefined;
  const displayName = profile?.displayName ?? googleAccount?.name ?? shortAddress(profile?.starknetAddress ?? '…');

  // Connected state
  if (authenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => navigate('/dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/dashboard')}
        >
          <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 text-xs font-bold shrink-0">
            {displayName[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm font-medium text-gray-300 hidden sm:block max-w-[120px] truncate">
            {displayName}
          </span>
        </div>
        <button
          onClick={() => logout().then(() => navigate('/'))}
          className="text-xs text-gray-600 hover:text-gray-300 font-medium transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Dark variant (hero / CTA) — white button on dark bg
  if (variant === 'dark') {
    return (
      <button
        onClick={() => login()}
        disabled={!ready}
        className={`inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold
          bg-white text-gray-900 hover:bg-gray-100
          active:scale-[0.98] transition-all duration-150 shadow-sm
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]
          disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          ${sizeClasses[size]} ${className}`}
        aria-busy={!ready}
      >
        {!ready ? <Spinner /> : <GoogleIcon />}
        Get Started Free
      </button>
    );
  }

  // Light variant (navbar)
  return (
    <button
      onClick={() => login()}
      disabled={!ready}
      className={`btn-google inline-flex items-center justify-center gap-2 ${sizeClasses[size]} ${className}`}
      aria-busy={!ready}
    >
      {!ready ? <Spinner /> : <GoogleIcon />}
      {!ready ? 'Loading…' : 'Sign in'}
    </button>
  );
}
