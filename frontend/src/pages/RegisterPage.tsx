import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useProfile, type UserRole } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';

export default function RegisterPage() {
  const { user } = usePrivy();
  const { profile, saveProfile } = useProfile(user?.id ?? null);
  const { connectStarknet, starknetAddress } = useWallet();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('freelancer');
  const googleAccount = user?.linkedAccounts?.find((a: { type: string }) => a.type === 'google_oauth') as
    | { name: string | null; email: string } | undefined;
  const [displayName, setDisplayName] = useState(
    googleAccount?.name ?? googleAccount?.email?.split('@')[0] ?? '',
  );
  const [bio, setBio] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);

  const resolvedAddress = starknetAddress ?? manualAddress.trim();

  async function handleConnectWallet() {
    setConnecting(true);
    try { await connectStarknet(); } finally { setConnecting(false); }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Name is required';
    if (!resolvedAddress) errs.address = 'A Starknet wallet address is required';
    else if (!/^0x[0-9a-fA-F]+$/.test(resolvedAddress)) errs.address = 'Enter a valid 0x… address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user?.id) return;
    
    setConnecting(true); // Re-use connecting state for registration loading
    try {
      const success = await saveProfile({ 
        role, 
        displayName: displayName.trim(), 
        bio: bio.trim() || undefined, 
        starknetAddress: resolvedAddress 
      });
      
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        alert('Failed to save profile to the marketplace. Please check your Supabase setup and try again.');
      }
    } finally {
      setConnecting(false);
    }
  }

  if (profile) return null;

  return (
    <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-glow-sm">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L2 5.25V9C2 12.45 5.08 15.67 9 16.5C12.92 15.67 16 12.45 16 9V5.25L9 1.5Z" fill="white" fillOpacity="0.9" />
                <path d="M6.5 9L8.25 10.75L11.75 7.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-gray-100 text-xl tracking-tight">
              Escrow<span className="text-brand-400">Hub</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-50">Complete your profile</h1>
          <p className="mt-2 text-gray-500 text-sm">This takes 30 seconds. Tell us who you are.</p>
        </div>

        <form onSubmit={handleSubmit} className="feature-card p-8 space-y-6">

          {/* Role selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {(['freelancer', 'client'] as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === r
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-white/[0.08] bg-surface-50/50 text-gray-500 hover:border-brand-500/30 hover:text-gray-300'
                  }`}
                >
                  {r === 'freelancer' ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  )}
                  <span className="text-sm font-semibold capitalize">{r}</span>
                  <span className="text-xs text-center leading-tight opacity-70">
                    {r === 'freelancer' ? 'I get hired & do work' : 'I hire & pay for work'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className={`input-dark ${errors.displayName ? 'input-dark-error' : ''}`}
            />
            {errors.displayName && <p className="mt-1.5 text-xs text-red-400">{errors.displayName}</p>}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Short bio <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="e.g. Full-stack developer with 5 years experience…"
              className="input-dark resize-none"
            />
          </div>

          {/* Starknet wallet */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Starknet wallet address
            </label>
            {starknetAddress ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-green-400 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-mono text-green-300 truncate">{starknetAddress}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    border-2 border-dashed border-brand-500/30 text-brand-400 text-sm font-semibold
                    hover:border-brand-500/60 hover:bg-brand-500/5 transition-all disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting…
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="5" width="16" height="12" rx="2" />
                        <path d="M2 9h16" />
                        <circle cx="14.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
                      </svg>
                      Connect Argent X or Braavos
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs text-gray-600">or paste manually</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder="0x04f3…"
                  spellCheck={false}
                  className={`input-dark font-mono ${errors.address ? 'input-dark-error' : ''}`}
                />
                {errors.address && <p className="mt-1.5 text-xs text-red-400">{errors.address}</p>}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-base">
            Create my account
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Connected as <span className="font-medium text-gray-400">{googleAccount?.email ?? 'Unknown'}</span>
        </p>
      </div>
    </div>
  );
}
