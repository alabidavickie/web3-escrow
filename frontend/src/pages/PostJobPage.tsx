import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { marketplace } from '../lib/marketplace';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SKILL_SUGGESTIONS = [
  'Cairo', 'Starknet', 'React', 'TypeScript', 'Solidity', 'Rust',
  'UI/UX Design', 'Smart Contracts', 'Frontend', 'Backend', 'Full-Stack',
  'Web3', 'DeFi', 'NFTs', 'API Integration', 'DevOps',
];

export default function PostJobPage() {
  const navigate = useNavigate();
  const { user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const { starknetAddress } = useWallet();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills]         = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [budgetMin, setBudgetMin]   = useState('');
  const [budgetMax, setBudgetMax]   = useState('');
  const [token, setToken]           = useState<'STRK' | 'USDC'>('STRK');
  const [deadline, setDeadline]     = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clientAddress = starknetAddress ?? profile?.starknetAddress ?? '';

  function addSkill(s: string) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 8) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  }

  function removeSkill(s: string) {
    setSkills(prev => prev.filter(x => x !== s));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (title.length > 100) errs.title = 'Max 100 characters';
    if (!description.trim()) errs.description = 'Description is required';
    if (description.trim().length < 50) errs.description = 'At least 50 characters — be specific so freelancers know what to expect';
    if (skills.length === 0) errs.skills = 'Add at least one skill';
    if (!budgetMin || isNaN(Number(budgetMin)) || Number(budgetMin) <= 0) errs.budgetMin = 'Enter a valid minimum budget';
    if (!budgetMax || isNaN(Number(budgetMax)) || Number(budgetMax) < Number(budgetMin)) errs.budgetMax = 'Max must be ≥ min';
    if (!deadline) errs.deadline = 'Set a deadline';
    else if (new Date(deadline) <= new Date()) errs.deadline = 'Deadline must be in the future';
    if (!clientAddress) errs.address = 'Connect your Starknet wallet first';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user?.id) return;
    setSubmitting(true);

    const googleAccount = user.linkedAccounts?.find((a: { type: string }) => a.type === 'google_oauth') as
      | { name: string | null } | undefined;

    marketplace.postJob({
      clientId: user.id,
      clientName: profile?.displayName ?? googleAccount?.name ?? 'Client',
      clientAddress,
      title: title.trim(),
      description: description.trim(),
      skills,
      budgetMin,
      budgetMax,
      token,
      deadline,
    });

    navigate('/jobs', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/jobs" className="hover:text-gray-300 transition-colors">Job board</Link>
          <span>/</span>
          <span className="text-gray-300 font-medium">Post a job</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-50">Post a job</h1>
          <p className="mt-1 text-gray-500 text-sm">Describe your project. Freelancers will send you proposals.</p>
        </div>

        {!clientAddress && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            Connect your Starknet wallet from the dashboard before posting a job — your wallet address is attached to the contract when you hire.
          </div>
        )}

        <form onSubmit={handleSubmit} className="feature-card p-8 space-y-7" noValidate>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Job title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Cairo smart contract developer for DeFi protocol"
              maxLength={100}
              className={`input-dark ${errors.title ? 'input-dark-error' : ''}`}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Project description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder={`Describe what you need:\n• What is the project about?\n• What should be delivered?\n• Any technical requirements?\n• How long do you expect this to take?`}
              className={`input-dark resize-none ${errors.description ? 'input-dark-error' : ''}`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description
                ? <p className="text-xs text-red-400">{errors.description}</p>
                : <span />}
              <span className="text-xs text-gray-600">{description.length} chars</span>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Required skills <span className="text-gray-600 font-normal normal-case tracking-normal">({skills.length}/8)</span>
            </label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/15 border border-brand-500/25 text-brand-300">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="text-brand-500 hover:text-red-400 transition-colors">×</button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Type a skill and press Enter"
                className="input-dark flex-1"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="btn-ghost px-4 text-xs"
              >Add</button>
            </div>

            {/* Quick-add suggestions */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 10).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] text-gray-500 hover:border-brand-500/40 hover:text-brand-300 transition-colors"
                >+ {s}</button>
              ))}
            </div>
            {errors.skills && <p className="mt-1.5 text-xs text-red-400">{errors.skills}</p>}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Budget range</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={budgetMin}
                  onChange={e => setBudgetMin(e.target.value)}
                  placeholder="Min"
                  min="0"
                  className={`input-dark pr-16 ${errors.budgetMin ? 'input-dark-error' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600 pointer-events-none">{token}</span>
              </div>
              <span className="text-gray-600 text-sm shrink-0">to</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={budgetMax}
                  onChange={e => setBudgetMax(e.target.value)}
                  placeholder="Max"
                  min="0"
                  className={`input-dark pr-16 ${errors.budgetMax ? 'input-dark-error' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600 pointer-events-none">{token}</span>
              </div>
              {/* Token toggle */}
              <div className="flex rounded-xl border border-white/[0.08] overflow-hidden shrink-0">
                {(['STRK', 'USDC'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setToken(t)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      token === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>
            {(errors.budgetMin || errors.budgetMax) && (
              <p className="mt-1.5 text-xs text-red-400">{errors.budgetMin || errors.budgetMax}</p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`input-dark [color-scheme:dark] ${errors.deadline ? 'input-dark-error' : ''}`}
            />
            {errors.deadline && <p className="mt-1.5 text-xs text-red-400">{errors.deadline}</p>}
          </div>

          {errors.address && (
            <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/15 px-3 py-2 rounded-lg">{errors.address}</p>
          )}

          <div className="pt-2 border-t border-white/[0.06]">
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base">
              {submitting ? 'Posting…' : 'Post this job'}
            </button>
            <p className="mt-3 text-center text-xs text-gray-600">
              Free to post · Visible to all freelancers on EscrowHub
            </p>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
