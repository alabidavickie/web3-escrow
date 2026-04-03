import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile } from '../hooks/useProfile';
import SignInButton from './SignInButton';

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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authenticated, user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const location = useLocation();
  const isLanding = location.pathname === '/';

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
                <Link to="/jobs"       className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Job board</Link>
                {authenticated && (
                  <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Dashboard</Link>
                )}
                {authenticated && profile?.role === 'client' && (
                  <Link to="/jobs/post" className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">Post a job</Link>
                )}
                {authenticated && profile?.role === 'client' && (
                  <Link to="/dashboard/create" className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors">New contract</Link>
                )}
              </>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <SignInButton variant="light" size="sm" />
            {!authenticated && (
              <Link to="/login" className="btn-primary py-2 text-xs">Get started free</Link>
            )}
            {authenticated && profile && (
              <Link to="/dashboard" className="btn-primary py-2 text-xs">Dashboard</Link>
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
            {isLanding && (
              <>
                <a href="#features"     onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Features</a>
                <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">How it works</a>
              </>
            )}
            {authenticated && (
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Dashboard</Link>
            )}
            {authenticated && profile?.role === 'client' && (
              <>
                <Link to="/jobs/post"        onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">Post a job</Link>
                <Link to="/dashboard/create" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors">New contract</Link>
              </>
            )}
            <div className="pt-3 flex flex-col gap-2 px-3">
              <SignInButton variant="light" size="sm" className="w-full" />
              {!authenticated && (
                <Link to="/login" className="btn-primary w-full text-center" onClick={() => setMenuOpen(false)}>Get started free</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
