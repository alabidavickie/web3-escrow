import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { RpcProvider, CallData, uint256 } from 'starknet';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { useEscrow } from '../hooks/useEscrow';
import { useToast, ToastContainer } from '../components/Toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ESCROW_ADDRESS, SUPPORTED_TOKENS } from '../lib/contracts';

const PROVIDER = new RpcProvider({ nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno/' });

function toU256Calldata(value: bigint): string[] {
  const low  = (value & ((1n << 128n) - 1n)).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function tokenSymbol(addr: string) {
  return SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === addr.toLowerCase())?.symbol ?? 'STRK';
}

function tokenDecimals(addr: string) {
  return SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === addr.toLowerCase())?.decimals ?? 18;
}

function formatAmount(raw: bigint, decimals: number) {
  if (raw === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  if (frac === 0n) return whole.toLocaleString();
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 3).replace(/0+$/, '');
  return `${whole.toLocaleString()}.${fracStr}`;
}

function decodeFelt(hex: string): string {
  try {
    const h = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (!h || h === '0') return '';
    let str = '';
    for (let i = 0; i < h.length; i += 2) {
      const code = parseInt(h.slice(i, i + 2), 16);
      if (code > 0) str += String.fromCharCode(code);
    }
    return str;
  } catch { return hex; }
}

interface ContractData {
  client: string;
  freelancer: string;
  token: string;
  totalAmount: bigint;
  deposited: boolean;
  status: number;
  milestoneCount: number;
  createdAt: bigint;
}

interface MilestoneData {
  description: string;
  amount: bigint;
  status: number;
  proofHash: string;
}

const CONTRACT_STATUS: Record<number, { label: string; dot: string; text: string }> = {
  0: { label: 'Active',    dot: 'bg-blue-400',  text: 'text-blue-400'  },
  1: { label: 'Completed', dot: 'bg-green-400', text: 'text-green-400' },
  2: { label: 'Disputed',  dot: 'bg-red-400',   text: 'text-red-400'   },
};

const MILESTONE_STATUS: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: 'Awaiting work',  bg: 'bg-white/5',          text: 'text-gray-500'   },
  1: { label: 'Work submitted', bg: 'bg-amber-500/10',     text: 'text-amber-400'  },
  2: { label: 'Paid',          bg: 'bg-green-500/10',     text: 'text-green-400'  },
  3: { label: 'Disputed',      bg: 'bg-red-500/10',       text: 'text-red-400'    },
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const { starknetAddress } = useWallet();
  const { submitMilestone, approveMilestone, raiseDispute, loading: txLoading, error: txError, clearError } = useEscrow();
  const { toasts, addToast, removeToast } = useToast();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [submitIdx, setSubmitIdx] = useState<number | null>(null);
  const [proofInput, setProofInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resolvedAddress = starknetAddress ?? profile?.starknetAddress ?? null;
  const contractId = id !== undefined ? BigInt(id) : null;

  const loadData = useCallback(async () => {
    if (contractId === null) return;
    setPageLoading(true);
    setPageError(null);
    try {
      const res = await PROVIDER.callContract({
        contractAddress: ESCROW_ADDRESS,
        entrypoint: 'get_contract',
        calldata: CallData.compile([...toU256Calldata(contractId)]),
      });
      const c: ContractData = {
        client:         res[0],
        freelancer:     res[1],
        token:          res[2],
        totalAmount:    uint256.uint256ToBN({ low: BigInt(res[3]), high: BigInt(res[4]) }),
        deposited:      BigInt(res[5]) !== 0n,
        status:         Number(BigInt(res[6])),
        milestoneCount: Number(BigInt(res[7])),
        createdAt:      BigInt(res[8]),
      };
      setContract(c);

      const loaded: MilestoneData[] = [];
      for (let i = 0; i < c.milestoneCount; i++) {
        const m = await PROVIDER.callContract({
          contractAddress: ESCROW_ADDRESS,
          entrypoint: 'get_milestone',
          calldata: CallData.compile([...toU256Calldata(contractId), i.toString()]),
        });
        loaded.push({
          description: decodeFelt(m[0]),
          amount:      uint256.uint256ToBN({ low: BigInt(m[1]), high: BigInt(m[2]) }),
          status:      Number(BigInt(m[3])),
          proofHash:   m[4],
        });
      }
      setMilestones(loaded);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load contract');
    }
    setPageLoading(false);
  }, [contractId]);

  useEffect(() => { loadData(); }, [loadData]);

  const isClient     = !!resolvedAddress && !!contract && contract.client.toLowerCase() === resolvedAddress.toLowerCase();
  const isFreelancer = !!resolvedAddress && !!contract && contract.freelancer.toLowerCase() === resolvedAddress.toLowerCase();

  const sym = contract ? tokenSymbol(contract.token) : 'STRK';
  const dec = contract ? tokenDecimals(contract.token) : 18;

  async function handleRelease(idx: number) {
    if (contractId === null) return;
    clearError();
    const ok = await approveMilestone(contractId, idx);
    if (ok) {
      addToast('success', 'Payment released!', `Milestone ${idx + 1} funds sent to the freelancer.`);
      await loadData();
    }
  }

  async function confirmSubmitWork() {
    if (contractId === null || submitIdx === null) return;
    setSubmitting(true);
    clearError();
    let proofFelt = '0x0';
    if (proofInput.trim()) {
      const trimmed = proofInput.trim().slice(0, 31);
      let hex = '';
      for (let i = 0; i < trimmed.length; i++) hex += trimmed.charCodeAt(i).toString(16).padStart(2, '0');
      proofFelt = '0x' + hex;
    }
    const ok = await submitMilestone(contractId, submitIdx, proofFelt);
    setSubmitting(false);
    if (ok) {
      addToast('success', 'Work submitted!', `Milestone ${submitIdx + 1} marked complete. Waiting for client approval.`);
      setSubmitIdx(null);
      await loadData();
    }
  }

  async function handleDispute(idx: number) {
    if (contractId === null) return;
    clearError();
    const ok = await raiseDispute(contractId, idx);
    if (ok) {
      addToast('info', 'Dispute raised', `Milestone ${idx + 1} is now under review.`);
      await loadData();
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#09090f]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </main>
        <Footer />
      </div>
    );
  }

  if (pageError || !contract) {
    return (
      <div className="min-h-screen flex flex-col bg-[#09090f]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 font-medium mb-4">{pageError ?? 'Contract not found'}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary py-2 text-sm">
              Back to dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cs = CONTRACT_STATUS[contract.status] ?? { label: 'Unknown', dot: 'bg-gray-500', text: 'text-gray-400' };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-300 font-medium">Contract #{String(contractId)}</span>
        </nav>

        {/* Contract header */}
        <div className="feature-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h1 className="text-xl font-extrabold text-gray-50">Contract #{String(contractId)}</h1>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cs.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} ${contract.status === 0 ? 'animate-pulse' : ''}`} />
                  {cs.label}
                </span>
                {(isClient || isFreelancer) && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
                    {isClient ? 'You are the client' : 'You are the freelancer'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  { label: 'Client',      value: `${shortAddr(contract.client)}${isClient ? ' (you)' : ''}`,       mono: true, highlight: isClient },
                  { label: 'Freelancer',  value: `${shortAddr(contract.freelancer)}${isFreelancer ? ' (you)' : ''}`, mono: true, highlight: isFreelancer },
                  { label: 'Token',       value: sym,                                                                 mono: false },
                  { label: 'Funds held',  value: `${formatAmount(contract.totalAmount, dec)} ${sym}`,                 mono: false, bold: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="text-gray-600 w-20 shrink-0">{row.label}</span>
                    <span className={`${row.mono ? 'font-mono text-xs' : ''} ${row.bold ? 'font-bold text-gray-100' : ''} ${row.highlight ? 'text-brand-300' : 'text-gray-300'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 w-20 shrink-0">Deposited</span>
                  <span className={`text-sm font-medium ${contract.deposited ? 'text-green-400' : 'text-amber-400'}`}>
                    {contract.deposited ? 'Funds in escrow' : 'Not yet deposited'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tx error banner */}
        {txError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-2">
            <span>{txError}</span>
            <button onClick={clearError} className="shrink-0 text-red-600 hover:text-red-400 transition-colors">✕</button>
          </div>
        )}

        {/* Milestones */}
        <div className="rounded-2xl border border-white/[0.07] bg-surface-200 overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-gray-200 text-sm">Milestones</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {isClient ? 'Review and release payment when a milestone is complete.'
                : isFreelancer ? 'Submit your work when a milestone is done.'
                : 'Progress for this contract.'}
            </p>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {milestones.map((m, i) => {
              const ms = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS[0];
              const canRelease = isClient     && m.status === 1 && contract.status === 0;
              const canSubmit  = isFreelancer && m.status === 0 && contract.status === 0 && contract.deposited;
              const canDispute = (isClient || isFreelancer) && m.status === 1 && contract.status === 0;

              return (
                <div key={i} className="px-6 py-5">
                  <div className="flex gap-4">
                    {/* Number */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
                      ${m.status === 2 ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : m.status === 3 ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'bg-white/5 text-gray-500 border border-white/[0.07]'}`}>
                      {m.status === 2 ? '✓' : m.status === 3 ? '!' : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-200 text-sm">
                          {m.description || `Milestone ${i + 1}`}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ms.bg} ${ms.text} border-current/20`}>
                          {ms.label}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-gray-100 mb-2">
                        {formatAmount(m.amount, dec)}{' '}
                        <span className="text-brand-400 font-semibold">{sym}</span>
                      </p>

                      {m.status >= 1 && m.proofHash && m.proofHash !== '0x0' && (
                        <p className="text-xs text-gray-600 mb-2 font-mono">
                          Proof: {decodeFelt(m.proofHash) || shortAddr(m.proofHash)}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        {canSubmit && (
                          <button onClick={() => { setSubmitIdx(i); setProofInput(''); }} disabled={txLoading}
                            className="btn-primary py-1.5 px-4 text-xs">
                            Submit Work
                          </button>
                        )}
                        {canRelease && (
                          <button onClick={() => handleRelease(i)} disabled={txLoading}
                            className="btn-primary py-1.5 px-4 text-xs">
                            {txLoading ? 'Processing…' : 'Release Payment'}
                          </button>
                        )}
                        {canDispute && (
                          <button onClick={() => handleDispute(i)} disabled={txLoading}
                            className="py-1.5 px-4 text-xs rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                            Raise Dispute
                          </button>
                        )}
                        {!canSubmit && !canRelease && !canDispute && m.status === 0 && isFreelancer && !contract.deposited && (
                          <p className="text-xs text-amber-500/70 bg-amber-500/5 border border-amber-500/15 px-3 py-1.5 rounded-lg">
                            Waiting for client to fund the contract
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-300 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </main>
      <Footer />

      {/* Submit Work modal */}
      {submitIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-200 border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-extrabold text-gray-50 mb-1">
              Submit Work — Milestone {submitIdx + 1}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Add an optional proof link or note (max 31 chars). Stored on-chain.
            </p>

            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Proof / note <span className="text-gray-600 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={proofInput}
              onChange={e => setProofInput(e.target.value.slice(0, 31))}
              placeholder="e.g. github.com/repo/pr/42"
              maxLength={31}
              className="input-dark mb-5"
            />

            <div className="flex gap-3">
              <button onClick={confirmSubmitWork} disabled={submitting || txLoading} className="btn-primary flex-1 py-3 text-sm">
                {submitting || txLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </span>
                ) : 'Confirm submission'}
              </button>
              <button onClick={() => setSubmitIdx(null)} disabled={submitting}
                className="btn-ghost px-5 py-3">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
