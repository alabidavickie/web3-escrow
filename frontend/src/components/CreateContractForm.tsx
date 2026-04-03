import { useState, useCallback } from 'react';
import { useEscrow } from '../hooks/useEscrow';
import { useWallet } from '../hooks/useWallet';
import { useToast, ToastContainer } from './Toast';
import { SUPPORTED_TOKENS, type SupportedToken } from '../lib/contracts';
import SignInButton from './SignInButton';

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

interface MilestoneField {
  description: string;
  amount: string;
}

const EMPTY_MILESTONE: MilestoneField = { description: '', amount: '' };

export default function CreateContractForm() {
  const { isConnected } = useWallet();
  const { createAndDeposit, loading, error, clearError } = useEscrow();
  const { toasts, addToast, removeToast } = useToast();

  const [freelancer, setFreelancer]     = useState('');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(SUPPORTED_TOKENS[0]);
  const [milestones, setMilestones]     = useState<MilestoneField[]>([
    { ...EMPTY_MILESTONE }, { ...EMPTY_MILESTONE },
  ]);
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string>>({});

  const addMilestone    = () => setMilestones(prev => [...prev, { ...EMPTY_MILESTONE }]);
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, key: keyof MilestoneField, val: string) =>
    setMilestones(prev => prev.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)));

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!freelancer.startsWith('0x') || !/^0x[0-9a-fA-F]+$/.test(freelancer)) {
      errs.freelancer = 'Enter a valid hex address (0x…)';
    }
    milestones.forEach((m, i) => {
      if (!m.description.trim()) {
        errs[`desc_${i}`] = 'Description required';
      } else if (!/^[\x00-\x7F]*$/.test(m.description)) {
        errs[`desc_${i}`] = 'ASCII only (no emoji or accents)';
      } else if (m.description.length > 31) {
        errs[`desc_${i}`] = 'Max 31 characters';
      }
      if (parseTokenAmount(m.amount, selectedToken.decimals) === 0n) {
        errs[`amt_${i}`] = 'Amount must be > 0';
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const result = await createAndDeposit({
      freelancer,
      token: selectedToken.address,
      milestones: milestones.map(m => ({
        description: m.description.trim(),
        amount: parseTokenAmount(m.amount, selectedToken.decimals),
      })),
    });

    if (result) {
      const total = milestones.reduce(
        (s, m) => s + parseTokenAmount(m.amount, selectedToken.decimals), 0n
      );
      addToast(
        'success',
        `Contract #${result.contractId} created!`,
        `${formatTokenAmount(total, selectedToken.decimals)} ${selectedToken.symbol} deposited. Tx: ${shortAddr(result.txHash)}`,
      );
      setFreelancer('');
      setMilestones([{ ...EMPTY_MILESTONE }, { ...EMPTY_MILESTONE }]);
      setFieldErrors({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelancer, selectedToken, milestones, createAndDeposit, clearError, addToast]);

  const totalRaw = milestones.reduce((s, m) => {
    try { return s + parseTokenAmount(m.amount, selectedToken.decimals); } catch { return s; }
  }, 0n);
  const totalDisplay = formatTokenAmount(totalRaw, selectedToken.decimals);

  if (!isConnected) {
    return (
      <section id="create" className="py-20 bg-[#09090f]">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="section-label">Create contract</div>
          <h2 className="text-3xl font-extrabold text-gray-50 mt-2">Ready to get started?</h2>
          <p className="mt-3 text-gray-400">Connect your wallet to create an escrow contract.</p>
          <div className="mt-8 flex justify-center">
            <SignInButton variant="dark" size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <section id="create" className="py-20 bg-[#09090f]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="section-label">New escrow</div>
            <h2 className="text-3xl font-extrabold text-gray-50 mt-2">Create a contract</h2>
            <p className="mt-3 text-gray-500 text-sm">
              Funds are locked in the smart contract until you approve each milestone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="feature-card p-8 space-y-8" noValidate>

            {/* Global error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

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
            </div>

            {/* Payment token */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Payment token
              </label>
              <div className="flex gap-2">
                {SUPPORTED_TOKENS.map(token => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => setSelectedToken(token)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
                      ${selectedToken.address === token.address
                        ? 'bg-brand-600 text-white border-brand-600 shadow-glow-sm'
                        : 'bg-surface-50/50 text-gray-400 border-white/[0.08] hover:border-brand-500/40 hover:text-gray-200'
                      }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${selectedToken.address === token.address ? 'bg-white/20 text-white' : 'bg-brand-500/20 text-brand-400'}`}>
                      {token.symbol[0]}
                    </span>
                    {token.symbol}
                    <span className={`text-xs ${selectedToken.address === token.address ? 'text-brand-200' : 'text-gray-600'}`}>
                      {token.decimals === 6 ? '6 dec' : '18 dec'}
                    </span>
                  </button>
                ))}
              </div>
              {selectedToken.symbol === 'USDC' && (
                <p className="mt-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                  Testnet USDC — get some from the{' '}
                  <a href="https://starkgate.starknet.io" target="_blank" rel="noopener noreferrer" className="underline font-medium text-amber-400">
                    StarkGate faucet
                  </a>
                </p>
              )}
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Milestones</label>
                <span className="text-xs text-gray-600">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-2.5">
                {milestones.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2 items-start">
                    <div>
                      <input
                        type="text"
                        value={m.description}
                        onChange={e => { updateMilestone(i, 'description', e.target.value); setFieldErrors(p => ({ ...p, [`desc_${i}`]: '' })); }}
                        placeholder={`Milestone ${i + 1} (e.g. Design)`}
                        maxLength={31}
                        className={`input-dark ${fieldErrors[`desc_${i}`] ? 'input-dark-error' : ''}`}
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
                          className={`input-dark pr-14 ${fieldErrors[`amt_${i}`] ? 'input-dark-error' : ''}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600 pointer-events-none">
                          {selectedToken.symbol}
                        </span>
                      </div>
                      {fieldErrors[`amt_${i}`] && <p className="mt-1 text-xs text-red-400">{fieldErrors[`amt_${i}`]}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      disabled={milestones.length <= 1}
                      className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl
                        text-gray-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                        disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove milestone"
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6 2a1 1 0 00-1 1v.5H3a.5.5 0 000 1h.5V13a1 1 0 001 1h7a1 1 0 001-1V4.5H13a.5.5 0 000-1h-2V3a1 1 0 00-1-1H6zm1 1h2v.5H7V3zm-2 2h6V13H5V5z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMilestone}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
                </svg>
                Add milestone
              </button>
            </div>

            {/* Total + Submit */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-gray-500">Total to deposit</span>
                <span className="text-lg font-bold text-gray-100">
                  {totalDisplay} <span className="text-sm font-semibold text-brand-400">{selectedToken.symbol}</span>
                </span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Create &amp; Deposit
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-600">
                Secured by Starknet · Gas paid via your connected wallet
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
