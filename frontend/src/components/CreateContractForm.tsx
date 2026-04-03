import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useEscrow } from '../hooks/useEscrow';
import { useWallet } from '../hooks/useWallet';
import { useToast, ToastContainer } from './Toast';
import { SUPPORTED_TOKENS, type SupportedToken } from '../lib/contracts';
import { marketplace } from '../lib/marketplace';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTokenAmount(s: string, decimals: number): bigint {
  const trimmed = s.trim();
  if (!trimmed || trimmed === '.') return 0n;
  const [whole = '0', frac = ''] = trimmed.split('.');
  const fracPadded = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fracPadded);
}

function formatTokenAmount(raw: bigint, decimals: number): string {
  if (raw === 0n) return '—';
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const frac  = raw % divisor;
  if (frac === 0n) return whole.toLocaleString();
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 3).replace(/0+$/, '');
  return `${whole.toLocaleString()}.${fracStr}`;
}

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MilestoneField {
  description: string;
  amount: string;
}

const EMPTY_MILESTONE: MilestoneField = { description: '', amount: '' };

const CONTRACT_CATEGORIES = [
  'Smart Contract Dev', 'Frontend / UI', 'Backend / API', 'Full-Stack',
  'UI/UX Design', 'Cairo / Starknet', 'Audit & Security', 'DevOps',
  'Content Writing', 'Marketing', 'Other',
];

const DURATION_OPTIONS = [
  'Less than 1 week', '1–2 weeks', '2–4 weeks', '1–2 months', '2–3 months', '3+ months',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateContractForm() {
  const navigate = useNavigate();
  const { authenticated } = usePrivy();
  const { isConnected, isConnecting, connectStarknet, starknetAddress } = useWallet();
  const { createAndDeposit, loading, error, clearError } = useEscrow();
  const { toasts, addToast, removeToast } = useToast();
  const [searchParams] = useSearchParams();

  // Pre-fill from job acceptance
  const prefillFreelancer = searchParams.get('freelancer') ?? '';
  const prefillJobTitle   = searchParams.get('jobTitle') ?? '';
  const prefillJobId      = searchParams.get('jobId') ?? '';

  // Form state
  const [title, setTitle]           = useState(prefillJobTitle || '');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState(CONTRACT_CATEGORIES[0]);
  const [duration, setDuration]     = useState(DURATION_OPTIONS[1]);
  const [freelancer, setFreelancer] = useState(prefillFreelancer);
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(SUPPORTED_TOKENS[0]);
  const [milestones, setMilestones] = useState<MilestoneField[]>([
    { ...EMPTY_MILESTONE }, { ...EMPTY_MILESTONE },
  ]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // step 1 = details, step 2 = review & fund

  useEffect(() => {
    if (prefillFreelancer) setFreelancer(prefillFreelancer);
    if (prefillJobTitle)   setTitle(prefillJobTitle.slice(0, 80));
  }, [prefillFreelancer, prefillJobTitle]);

  const addMilestone    = () => setMilestones(prev => [...prev, { ...EMPTY_MILESTONE }]);
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, key: keyof MilestoneField, val: string) =>
    setMilestones(prev => prev.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)));

  async function handleConnectWallet() {
    setConnecting(true);
    await connectStarknet();
    setConnecting(false);
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Contract title is required';
    if (!description.trim() || description.length < 20) errs.description = 'Add a description (at least 20 characters)';
    if (!freelancer.startsWith('0x') || !/^0x[0-9a-fA-F]+$/.test(freelancer)) {
      errs.freelancer = 'Enter a valid Starknet address (0x…)';
    }
    milestones.forEach((m, i) => {
      if (!m.description.trim()) errs[`desc_${i}`] = 'Required';
      else if (!/^[\x00-\x7F]*$/.test(m.description)) errs[`desc_${i}`] = 'ASCII only (no emoji)';
      else if (m.description.length > 31) errs[`desc_${i}`] = 'Max 31 chars';
      if (parseTokenAmount(m.amount, selectedToken.decimals) === 0n) errs[`amt_${i}`] = 'Required';
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  }

  const handleSubmit = useCallback(async () => {
    clearError();
    const result = await createAndDeposit({
      freelancer,
      token: selectedToken.address,
      milestones: milestones.map(m => ({
        description: m.description.trim(),
        amount: parseTokenAmount(m.amount, selectedToken.decimals),
      })),
    });

    if (result) {
      // Mark job as in_progress if created from a job application
      if (prefillJobId) marketplace.markCompleted(prefillJobId);

      const total = milestones.reduce(
        (s, m) => s + parseTokenAmount(m.amount, selectedToken.decimals), 0n
      );
      addToast(
        'success',
        `Contract #${result.contractId} created!`,
        `${formatTokenAmount(total, selectedToken.decimals)} ${selectedToken.symbol} locked in escrow. Tx: ${shortAddr(result.txHash)}`,
      );
      navigate('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelancer, selectedToken, milestones, createAndDeposit, clearError, addToast, prefillJobId]);

  const totalRaw = milestones.reduce((s, m) => {
    try { return s + parseTokenAmount(m.amount, selectedToken.decimals); } catch { return s; }
  }, 0n);
  const totalDisplay = formatTokenAmount(totalRaw, selectedToken.decimals);

  // ── Step indicator ────────────────────────────────────────────────────────

  const StepBar = () => (
    <div className="flex items-center gap-3 mb-8">
      {[{ n: 1, label: 'Contract details' }, { n: 2, label: 'Review & fund' }].map((s, i) => (
        <div key={s.n} className="contents">
          <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${step === s.n ? 'text-brand-300' : step > s.n ? 'text-green-400' : 'text-gray-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step > s.n ? 'bg-green-500/20 border-green-500/40 text-green-400' :
              step === s.n ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' :
              'border-white/[0.1] text-gray-600'
            }`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className="hidden sm:block">{s.label}</span>
          </div>
          {i === 0 && <div className="flex-1 h-px bg-white/[0.08]" />}
        </div>
      ))}
    </div>
  );

  // ── Step 1: Contract details ───────────────────────────────────────────────

  if (step === 1) {
    return (
      <>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <section className="py-10 bg-[#09090f]">
          <div className="max-w-2xl mx-auto px-4">
            <StepBar />

            {prefillFreelancer && (
              <div className="mb-6 flex items-center gap-2 text-xs text-green-300 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Freelancer pre-filled from accepted proposal{prefillJobTitle ? ` — "${prefillJobTitle}"` : ''}
              </div>
            )}

            <form onSubmit={handleNext} className="feature-card p-8 space-y-7" noValidate>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contract title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Build Cairo escrow contract for DeFi protocol"
                  maxLength={80}
                  className={`input-dark ${fieldErrors.title ? 'input-dark-error' : ''}`}
                />
                {fieldErrors.title && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the project scope, deliverables, and any important requirements…"
                  className={`input-dark resize-none ${fieldErrors.description ? 'input-dark-error' : ''}`}
                />
                {fieldErrors.description && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.description}</p>}
              </div>

              {/* Category + Duration */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="input-dark [color-scheme:dark]"
                  >
                    {CONTRACT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Timeline</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="input-dark [color-scheme:dark]"
                  >
                    {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Freelancer address */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Freelancer wallet address
                </label>
                <input
                  type="text"
                  value={freelancer}
                  onChange={e => { setFreelancer(e.target.value); setFieldErrors(p => ({ ...p, freelancer: '' })); }}
                  placeholder="0x04f3…"
                  spellCheck={false}
                  className={`input-dark font-mono ${fieldErrors.freelancer ? 'input-dark-error' : ''}`}
                />
                {fieldErrors.freelancer && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.freelancer}</p>}
                <p className="mt-1.5 text-xs text-gray-600">
                  Don't have their address? Go to <a href="/jobs" className="text-brand-400 hover:underline">Job board</a> → post a job → accept a proposal (address auto-fills).
                </p>
              </div>

              {/* Token selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment token</label>
                <div className="flex gap-2">
                  {SUPPORTED_TOKENS.map(token => (
                    <button
                      key={token.address}
                      type="button"
                      onClick={() => setSelectedToken(token)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        selectedToken.address === token.address
                          ? 'bg-brand-600 text-white border-brand-600 shadow-glow-sm'
                          : 'bg-surface-50/50 text-gray-400 border-white/[0.08] hover:border-brand-500/40 hover:text-gray-200'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedToken.address === token.address ? 'bg-white/20 text-white' : 'bg-brand-500/20 text-brand-400'
                      }`}>{token.symbol[0]}</span>
                      {token.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Milestones
                  </label>
                  <span className="text-xs text-gray-600">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.07] bg-surface-300/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium text-gray-500">Milestone {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeMilestone(i)}
                          disabled={milestones.length <= 1}
                          className="ml-auto text-gray-700 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6 2a1 1 0 00-1 1v.5H3a.5.5 0 000 1h.5V13a1 1 0 001 1h7a1 1 0 001-1V4.5H13a.5.5 0 000-1h-2V3a1 1 0 00-1-1H6zm1 1h2v.5H7V3zm-2 2h6V13H5V5z" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-[1fr_150px] gap-3">
                        <div>
                          <input
                            type="text"
                            value={m.description}
                            onChange={e => { updateMilestone(i, 'description', e.target.value); setFieldErrors(p => ({ ...p, [`desc_${i}`]: '' })); }}
                            placeholder="e.g. UI wireframes, Smart contract deploy…"
                            maxLength={31}
                            className={`input-dark text-sm ${fieldErrors[`desc_${i}`] ? 'input-dark-error' : ''}`}
                          />
                          {fieldErrors[`desc_${i}`] && <p className="mt-1 text-xs text-red-400">{fieldErrors[`desc_${i}`]}</p>}
                        </div>
                        <div>
                          <div className="relative">
                            <input
                              type="number"
                              value={m.amount}
                              onChange={e => { updateMilestone(i, 'amount', e.target.value); setFieldErrors(p => ({ ...p, [`amt_${i}`]: '' })); }}
                              placeholder="0"
                              min="0"
                              step="any"
                              className={`input-dark pr-14 text-sm ${fieldErrors[`amt_${i}`] ? 'input-dark-error' : ''}`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600 pointer-events-none">
                              {selectedToken.symbol}
                            </span>
                          </div>
                          {fieldErrors[`amt_${i}`] && <p className="mt-1 text-xs text-red-400">{fieldErrors[`amt_${i}`]}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMilestone}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
                  </svg>
                  Add milestone
                </button>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <span className="text-sm text-gray-500">Total value</span>
                <span className="text-lg font-bold text-gray-100">
                  {totalDisplay} <span className="text-sm font-semibold text-brand-400">{selectedToken.symbol}</span>
                </span>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5 text-base">
                Review contract →
              </button>
            </form>
          </div>
        </section>
      </>
    );
  }

  // ── Step 2: Review & fund ─────────────────────────────────────────────────

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <section className="py-10 bg-[#09090f]">
        <div className="max-w-2xl mx-auto px-4">
          <StepBar />

          <div className="feature-card p-8 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-gray-50 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">{category}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-gray-500">{duration}</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-surface-300/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Freelancer</span>
                <span className="font-mono text-gray-300 text-xs">{shortAddr(freelancer)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Token</span>
                <span className="text-gray-300 font-medium">{selectedToken.symbol}</span>
              </div>
            </div>

            {/* Milestones review */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Milestones</p>
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.07] bg-surface-300/50">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">{i + 1}</span>
                    <span className="text-sm text-gray-300">{m.description}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-100">
                    {m.amount} <span className="text-brand-400 font-medium text-xs">{selectedToken.symbol}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-brand-500/20 bg-brand-500/5">
                <span className="text-sm font-semibold text-gray-300">Total to lock in escrow</span>
                <span className="text-base font-extrabold text-gray-50">
                  {totalDisplay} <span className="text-brand-400 font-semibold text-sm">{selectedToken.symbol}</span>
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Wallet section */}
            {!isConnected ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
                <p className="text-sm font-semibold text-amber-300 mb-1">Connect your wallet to fund the contract</p>
                <p className="text-xs text-amber-600 mb-4">You need Argent X or Braavos to sign the transaction.</p>
                <button
                  onClick={handleConnectWallet}
                  disabled={connecting || isConnecting}
                  className="btn-primary py-2.5 px-6 text-sm mx-auto"
                >
                  {connecting || isConnecting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting…
                    </span>
                  ) : 'Connect Argent X or Braavos'}
                </button>
                <p className="mt-3 text-xs text-gray-600">
                  No wallet?{' '}
                  <a href="https://www.argent.xyz/argent-x/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">Get Argent X free</a>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/5 border border-green-500/15">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-green-400 shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-green-300">Wallet: <span className="font-mono">{shortAddr(starknetAddress ?? '')}</span></span>
                </div>

                <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5 text-base">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting to Starknet…
                    </span>
                  ) : `Lock ${totalDisplay} ${selectedToken.symbol} in Escrow`}
                </button>

                <p className="text-center text-xs text-gray-600">
                  Funds are locked in a smart contract · Released only when you approve each milestone
                </p>
              </div>
            )}

            <button
              onClick={() => { setStep(1); clearError(); }}
              className="w-full text-sm text-gray-600 hover:text-gray-300 transition-colors"
            >
              ← Edit contract details
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
