import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { RpcProvider, CallData, uint256 } from 'starknet';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ESCROW_ADDRESS, SUPPORTED_TOKENS } from '../lib/contracts';

const PROVIDER = new RpcProvider({ nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno/' });

interface ContractSummary {
  id: bigint;
  client: string;
  freelancer: string;
  token: string;
  totalAmount: bigint;
  status: number;
  milestoneCount: number;
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

function toU256Calldata(value: bigint): string[] {
  const low  = (value & ((1n << 128n) - 1n)).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

const STATUS_LABEL: Record<number, { label: string; dot: string; text: string }> = {
  0: { label: 'Active',    dot: 'bg-blue-400',  text: 'text-blue-400'  },
  1: { label: 'Completed', dot: 'bg-green-400', text: 'text-green-400' },
  2: { label: 'Disputed',  dot: 'bg-red-400',   text: 'text-red-400'   },
};

export default function DashboardPage() {
  const { user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const { connectStarknet, starknetAddress } = useWallet();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const resolvedAddress = starknetAddress ?? profile?.starknetAddress ?? null;

  useEffect(() => {
    if (!resolvedAddress) return;
    loadContracts(resolvedAddress);
  }, [resolvedAddress]);

  async function loadContracts(addr: string) {
    setLoading(true);
    try {
      const countRes = await PROVIDER.callContract({
        contractAddress: ESCROW_ADDRESS,
        entrypoint: 'get_contract_count',
        calldata: [],
      });
      const total = Number(BigInt(countRes[0]));
      const found: ContractSummary[] = [];
      const addrNorm = addr.toLowerCase();

      for (let i = 0; i < total && found.length < 50; i++) {
        try {
          const res = await PROVIDER.callContract({
            contractAddress: ESCROW_ADDRESS,
            entrypoint: 'get_contract',
            calldata: CallData.compile([...toU256Calldata(BigInt(i))]),
          });
          const client         = res[0];
          const freelancer     = res[1];
          const token          = res[2];
          const amtLow         = BigInt(res[3]);
          const amtHigh        = BigInt(res[4]);
          const status         = Number(BigInt(res[6]));
          const milestoneCount = Number(BigInt(res[7]));
          const totalAmount    = uint256.uint256ToBN({ low: amtLow, high: amtHigh });

          if (client.toLowerCase() === addrNorm || freelancer.toLowerCase() === addrNorm) {
            found.push({ id: BigInt(i), client, freelancer, token, totalAmount, status, milestoneCount });
          }
        } catch { /* skip */ }
      }
      setContracts(found);
    } catch { /* silent fail */ }
    setLoading(false);
  }

  async function handleConnectStarknet() {
    setConnecting(true);
    await connectStarknet();
    setConnecting(false);
  }

  const googleAccount = user?.linkedAccounts?.find((a: { type: string }) => a.type === 'google_oauth') as
    | { type: 'google_oauth'; name: string | null; email: string } | undefined;
  const displayName = profile?.displayName ?? googleAccount?.name ?? 'there';

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-50">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 text-sm text-gray-500 capitalize">
              {profile?.role ?? 'User'} · Starknet Sepolia
            </p>
          </div>
          {profile?.role === 'client' && (
            <Link to="/dashboard/create" className="btn-primary py-2.5 text-sm whitespace-nowrap">
              + New contract
            </Link>
          )}
        </div>

        {/* Connect wallet banner */}
        {!resolvedAddress && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="text-amber-400">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Connect your Starknet wallet to see your contracts</p>
              <p className="text-xs text-amber-600 mt-0.5">Use Argent X or Braavos browser extension</p>
            </div>
            <button onClick={handleConnectStarknet} disabled={connecting} className="btn-primary py-2 text-xs shrink-0">
              {connecting ? 'Connecting…' : 'Connect wallet'}
            </button>
          </div>
        )}

        {/* Stats */}
        {resolvedAddress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total contracts', value: contracts.length },
              { label: 'Active',          value: contracts.filter(c => c.status === 0).length },
              { label: 'Completed',       value: contracts.filter(c => c.status === 1).length },
              { label: 'Disputed',        value: contracts.filter(c => c.status === 2).length },
            ].map(s => (
              <div key={s.label} className="feature-card p-4">
                <p className="text-2xl font-extrabold text-gray-50">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Contract list */}
        <div className="rounded-2xl border border-white/[0.07] bg-surface-200 overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-semibold text-gray-200 text-sm">Your contracts</h2>
            {resolvedAddress && (
              <span className="text-xs text-gray-600 font-mono">{shortAddr(resolvedAddress)}</span>
            )}
          </div>

          {!resolvedAddress ? (
            <div className="px-6 py-16 text-center text-gray-600 text-sm">
              Connect your wallet to view contracts
            </div>
          ) : loading ? (
            <div className="px-6 py-16 flex justify-center">
              <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : contracts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-500 text-sm">No contracts found for this address.</p>
              {profile?.role === 'client' && (
                <Link to="/dashboard/create" className="mt-4 btn-primary py-2 text-sm inline-flex">
                  Create your first contract
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {contracts.map(c => {
                const sym = tokenSymbol(c.token);
                const dec = tokenDecimals(c.token);
                const st = STATUS_LABEL[c.status] ?? { label: 'Unknown', dot: 'bg-gray-400', text: 'text-gray-400' };
                const isClient = c.client.toLowerCase() === resolvedAddress.toLowerCase();

                return (
                  <Link
                    key={String(c.id)}
                    to={`/dashboard/contract/${String(c.id)}`}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-200">
                          Contract #{String(c.id)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        <span className="text-xs text-gray-600 px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06]">
                          {isClient ? 'Client' : 'Freelancer'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>
                          {isClient ? 'Freelancer' : 'Client'}:{' '}
                          <span className="font-mono">{shortAddr(isClient ? c.freelancer : c.client)}</span>
                        </span>
                        <span>{c.milestoneCount} milestone{c.milestoneCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-bold text-gray-200">
                        {formatAmount(c.totalAmount, dec)}{' '}
                        <span className="text-brand-400 font-semibold">{sym}</span>
                      </p>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-700">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
