import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile } from '../hooks/useProfile';
import SignInButton from './SignInButton';

const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
];

const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5 group">
    <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center shadow-glow-sm">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 1.5L2 5.25V9C2 12.45 5.08 15.67 9 16.5C12.92 15.67 16 12.45 16 9V5.25L9 1.5Z" fill="white" fillOpacity="0.9" />
        <path d="M6.5 9L8.25 10.75L11.75 7.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="font-bold text-gray-100 text-lg tracking-tight">
      Escrow<span className="text-brand-400">Hub</span>
    </span>
  </Link>
);

function UserMenu({ displayName, role }: { displayName: string; role?: string }) {
  const [open, setOpen] = useState(false);
  const { logout } = usePrivy();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = displayName[0]?.toUpperCase() ?? '?';
  const gradient = AVATAR_GRADIENTS[initial.charCodeAt(0) % AVATAR_GRADIENTS.length];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
        aria-label="User menu"
      >
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
          {initial}
        </div>
        <span className="text-xs font-medium text-gray-300 max-w-[80px] truncate">{displayName}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#111118] shadow-xl py-1 z-50 animate-fade-in">
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-gray-300 truncate">{displayName}</p>
            {role && <p className="text-xs text-gray-600 capitalize">{role}</p>}
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
              <path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </Link>
          <div className="border-t border-white/[0.06] mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authenticated, user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const googleAccount = user?.linkedAccounts?.find(
    (a: { type: string }) => a.type === 'google_oauth',
  ) as { name: string | null } | undefined;
  const displayName = profile?.displayName ?? googleAccount?.name ?? 'Account';

  return (
    <header className="sticky top-0 z-50 bg-[#09090f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {isLanding ? (
              <>
                <a href="#features"    className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">How it works</a>
                <Link to="/jobs"       className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Job board</Link>
              </>
            ) : (
              <>
                <Link to="/jobs"        className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Jobs</Link>
                <Link to="/freelancers" className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Freelancers</Link>
                {authenticated && profile?.role === 'client' && (
                  <Link to="/jobs/post" className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Post a job</Link>
                )}
              </>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {!authenticated && (
              <>
                <SignInButton variant="light" size="sm" />
                <Link to="/login" className="btn-primary py-2 text-xs">Get started free</Link>
              </>
            )}
            {authenticated && (
              <UserMenu displayName={displayName} role={profile?.role} />
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-white/[0.06] space-y-1 animate-fade-in">
            <Link to="/jobs" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Job board</Link>
            <Link to="/freelancers" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Freelancers</Link>
            {isLanding && (
              <>
                <a href="#features"     onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Features</a>
                <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">How it works</a>
              </>
            )}
            {authenticated && (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Dashboard</Link>
                <Link to="/profile"   onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Profile</Link>
              </>
            )}
            {authenticated && profile?.role === 'client' && (
              <>
                <Link to="/jobs/post"        onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Post a job</Link>
                <Link to="/dashboard/create" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">New contract</Link>
              </>
            )}
            <div className="pt-3 flex flex-col gap-2 px-3">
              {!authenticated && (
                <>
                  <SignInButton variant="light" size="sm" className="w-full" />
                  <Link to="/login" className="btn-primary w-full text-center" onClick={() => setMenuOpen(false)}>Get started free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
