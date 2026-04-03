import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
];

export default function ProfilePage() {
  const { user } = usePrivy();
  const { starknetAddress } = useWallet();
  const { profile, loading, saveProfile } = useProfile(user?.id ?? null);

  const googleAccount = user?.linkedAccounts?.find(
    (a: { type: string }) => a.type === 'google_oauth',
  ) as { email: string; name: string | null } | undefined;
  const email = googleAccount?.email ?? '';

  const [displayName, setDisplayName]   = useState('');
  const [nickname, setNickname]         = useState('');
  const [bio, setBio]                   = useState('');
  const [walletAddr, setWalletAddr]     = useState('');
  const [xLink, setXLink]               = useState('');
  const [tgLink, setTgLink]             = useState('');
  const [discordLink, setDiscordLink]   = useState('');
  const [saved, setSaved]               = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setNickname(profile.nickname ?? '');
      setBio(profile.bio ?? '');
      setWalletAddr(profile.starknetAddress ?? starknetAddress ?? '');
      setXLink(profile.xLink ?? '');
      setTgLink(profile.tgLink ?? '');
      setDiscordLink(profile.discordLink ?? '');
    } else if (starknetAddress) {
      setWalletAddr(starknetAddress);
    }
  }, [loading, profile, starknetAddress]);

  // Keep wallet field in sync when wallet connects
  useEffect(() => {
    if (starknetAddress && !walletAddr) setWalletAddr(starknetAddress);
  }, [starknetAddress]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Name is required';
    if (displayName.trim().length > 60) errs.displayName = 'Max 60 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !profile) return;
    saveProfile({
      ...profile,
      displayName: displayName.trim(),
      nickname: nickname.trim() || undefined,
      bio: bio.trim() || undefined,
      starknetAddress: walletAddr.trim(),
      xLink: xLink.trim() || undefined,
      tgLink: tgLink.trim() || undefined,
      discordLink: discordLink.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const initial = displayName[0]?.toUpperCase() ?? '?';
  const gradient = AVATAR_GRADIENTS[initial.charCodeAt(0) % AVATAR_GRADIENTS.length];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#09090f]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin h-7 w-7 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-50">Profile</h1>
          <p className="mt-1 text-gray-500 text-sm">Manage your public identity on EscrowHub</p>
        </div>

        {/* Avatar card */}
        <div className="feature-card p-6 mb-6 flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-glow-sm`}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-100 text-lg truncate">{displayName || 'Your Name'}</p>
            {nickname && <p className="text-sm text-gray-500">@{nickname}</p>}
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-full capitalize">
              {profile?.role ?? 'user'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="feature-card p-8 space-y-6" noValidate>

          {/* Email — read only */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sign-in email
              <span className="ml-2 text-gray-600 font-normal normal-case tracking-normal">(read-only)</span>
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 cursor-not-allowed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600 shrink-0">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span className="text-sm text-gray-500">{email || 'Not connected'}</span>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Display name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
              maxLength={60}
              className={`input-dark ${errors.displayName ? 'input-dark-error' : ''}`}
            />
            {errors.displayName && <p className="mt-1.5 text-xs text-red-400">{errors.displayName}</p>}
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Nickname / handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">@</span>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value.replace(/\s/g, ''))}
                placeholder="yourhandle"
                maxLength={30}
                className="input-dark pl-8"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Tell clients or freelancers about yourself — your expertise, what you do, past projects…"
              maxLength={500}
              className="input-dark resize-none"
            />
            <p className="mt-1 text-right text-xs text-gray-600">{bio.length}/500</p>
          </div>

          {/* Starknet wallet */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Starknet wallet address
            </label>
            <input
              type="text"
              value={walletAddr}
              onChange={e => setWalletAddr(e.target.value.trim())}
              placeholder="0x..."
              className="input-dark font-mono text-sm"
            />
            {starknetAddress && walletAddr !== starknetAddress && (
              <p className="mt-1.5 text-xs text-amber-400">
                Connected wallet is{' '}
                <button
                  type="button"
                  onClick={() => setWalletAddr(starknetAddress)}
                  className="underline hover:text-amber-300 transition-colors font-mono"
                >
                  {starknetAddress.slice(0, 10)}…{starknetAddress.slice(-4)}
                </button>
                {' '}— click to use it.
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-600">
              This address is used for escrow contracts and shown publicly on your profile.
            </p>
          </div>

          {/* Social links */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Social links <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <div className="space-y-3">
              {(
                [
                  {
                    key: 'x', label: 'X (Twitter)', value: xLink, set: setXLink,
                    placeholder: 'https://x.com/yourhandle',
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.731-8.84L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ),
                  },
                  {
                    key: 'tg', label: 'Telegram', value: tgLink, set: setTgLink,
                    placeholder: 'https://t.me/yourhandle',
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    ),
                  },
                  {
                    key: 'discord', label: 'Discord', value: discordLink, set: setDiscordLink,
                    placeholder: 'username or discord.gg/invite',
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                      </svg>
                    ),
                  },
                ] as const
              ).map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    {field.icon}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={field.value}
                      onChange={e => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="input-dark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <button
              type="submit"
              className={`btn-primary w-full py-3.5 text-base transition-all ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-white">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Profile saved!
                </span>
              ) : 'Save profile'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
