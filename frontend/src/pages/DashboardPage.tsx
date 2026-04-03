import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { RpcProvider, CallData, uint256 } from 'starknet';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { marketplace, ContractOffer } from '../lib/marketplace';
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

type TabId = 'contracts' | 'offers';

const OFFER_STATUS_STYLE: Record<string, { label: string; text: string; bg: string }> = {
  pending:    { label: 'Pending',    text: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  accepted:   { label: 'Accepted',  text: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  declined:   { label: 'Declined',  text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'   },
  contracted: { label: 'Contracted',text: 'text-brand-400',  bg: 'bg-brand-500/10 border-brand-500/20' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const { connectStarknet, starknetAddress } = useWallet();
  const roleError = (location.state as { roleError?: string } | null)?.roleError ?? null;
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tab, setTab] = useState<TabId>('contracts');
  const [offers, setOffers] = useState<ContractOffer[]>([]);

  const resolvedAddress = starknetAddress ?? profile?.starknetAddress ?? null;

  useEffect(() => {
    if (!resolvedAddress) return;
    loadContracts(resolvedAddress);
  }, [resolvedAddress]);

  useEffect(() => {
    if (!user?.id || !profile?.role) return;
    if (profile.role === 'freelancer') {
      marketplace.getOffersForFreelancer(user.id).then(setOffers);
    } else if (profile.role === 'client') {
      marketplace.getOffersByClient(user.id).then(setOffers);
    }
  }, [user?.id, profile?.role]);

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

  async function handleAcceptOffer(offer: ContractOffer) {
    const result = await marketplace.acceptOffer(offer.id, user?.id);
    if (!result) return;
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o));
    const params = new URLSearchParams({
      freelancer: offer.freelancerAddress,
      freelancerName: offer.freelancerName,
      offerTitle: offer.title,
      offerId: offer.id,
    });
    navigate(`/dashboard/create?${params.toString()}`);
  }

  async function handleDeclineOffer(offerId: string) {
    await marketplace.declineOffer(offerId, user?.id);
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'declined' } : o));
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

        {/* Role-access error */}
        {roleError && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3.5 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-red-400 shrink-0">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414A6 6 0 006.524 5.11L14.89 13.476zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-300">{roleError}</p>
          </div>
        )}

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

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {([
            { id: 'contracts' as TabId, label: 'Contracts', count: contracts.length },
            { id: 'offers' as TabId, label: profile?.role === 'client' ? 'Sent Offers' : 'Offer Inbox', count: offers.filter(o => o.status === 'pending').length },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                tab === t.id
                  ? 'bg-white/[0.07] text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  tab === t.id ? 'bg-brand-500/30 text-brand-300' : 'bg-white/[0.06] text-gray-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contracts tab */}
        {tab === 'contracts' && (
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
                          <span className="text-sm font-semibold text-gray-200">Contract #{String(c.id)}</span>
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
        )}

        {/* Offers tab */}
        {tab === 'offers' && (
          <div className="rounded-2xl border border-white/[0.07] bg-surface-200 overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-gray-200 text-sm">
                {profile?.role === 'client' ? 'Contract offers you sent' : 'Contract offers received'}
              </h2>
              {profile?.role === 'freelancer' && (
                <p className="text-xs text-gray-600 mt-0.5">Accept an offer to create the on-chain escrow contract.</p>
              )}
            </div>

            {offers.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {profile?.role === 'client'
                    ? 'No offers sent yet. Browse freelancers and send a contract offer.'
                    : 'No contract offers yet. Keep your profile updated to attract clients.'}
                </p>
                {profile?.role === 'client' && (
                  <Link to="/freelancers" className="mt-4 btn-primary py-2 text-sm inline-flex">Browse freelancers</Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {offers.map(offer => {
                  const style = OFFER_STATUS_STYLE[offer.status] ?? OFFER_STATUS_STYLE.pending;
                  return (
                    <div key={offer.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-gray-200 truncate">{offer.title}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.text} ${style.bg}`}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{offer.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                          <span>
                            {profile?.role === 'client' ? 'To: ' : 'From: '}
                            <span className="font-semibold text-gray-400">
                              {profile?.role === 'client' ? offer.freelancerName : offer.clientName}
                            </span>
                          </span>
                          <span>
                            {offer.milestones.length} milestone{offer.milestones.length !== 1 ? 's' : ''}
                          </span>
                          <span className="font-semibold text-gray-300">
                            {offer.totalAmount} {offer.token}
                          </span>
                          <span>{offer.duration}</span>
                        </div>
                      </div>
                      {profile?.role === 'freelancer' && offer.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleDeclineOffer(offer.id)}
                            className="btn-ghost px-3 py-1.5 text-xs text-red-400 border-red-500/20 hover:border-red-500/40"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptOffer(offer)}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            Accept &amp; create contract →
                          </button>
                        </div>
                      )}
                      {profile?.role === 'freelancer' && offer.status === 'accepted' && (
                        <Link
                          to={`/dashboard/create?freelancer=${offer.freelancerAddress}&offerTitle=${encodeURIComponent(offer.title)}&offerId=${offer.id}`}
                          className="btn-primary px-3 py-1.5 text-xs shrink-0"
                        >
                          Create contract →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
