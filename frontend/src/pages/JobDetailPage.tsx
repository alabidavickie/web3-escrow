import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { marketplace, type Job, type JobApplication } from '../lib/marketplace';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);
  const { starknetAddress } = useWallet();

  const [job, setJob]               = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [proposal, setProposal]     = useState('');
  const [rate, setRate]             = useState('');
  const [applying, setApplying]     = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [showApplyForm, setShowApplyForm] = useState(false);

  async function reload() {
    if (!id) return;
    setJobLoading(true);
    const j = await marketplace.getJobById(id);
    setJob(j);
    setJobLoading(false);
  }

  useEffect(() => { reload(); }, [id]);

  if (jobLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#09090f]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin h-7 w-7 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col bg-[#09090f]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Job not found.</p>
            <Link to="/jobs" className="btn-primary py-2 text-sm">Back to job board</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isClient     = user?.id === job.clientId;
  const isFreelancer = profile?.role === 'freelancer';
  const myApp        = job.applications.find(a => a.freelancerId === user?.id);
  const freelancerAddress = starknetAddress ?? profile?.starknetAddress ?? '';
  const acceptedApp  = job.applications.find(a => a.status === 'accepted');

  function validateApply(): boolean {
    const errs: Record<string, string> = {};
    if (!proposal.trim() || proposal.length < 50) errs.proposal = "Write at least 50 characters — explain why you're the right fit";
    if (!rate.trim() || isNaN(Number(rate)) || Number(rate) <= 0) errs.rate = 'Enter your rate in ' + job!.token;
    if (!freelancerAddress) errs.address = 'Connect your Starknet wallet before applying';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!validateApply() || !user?.id) return;

    const googleAccount = user.linkedAccounts?.find((a: { type: string }) => a.type === 'google_oauth') as
      | { name: string | null } | undefined;

    setApplying(true);
    await marketplace.applyToJob(job!.id, {
      freelancerId: user.id,
      freelancerName: profile?.displayName ?? googleAccount?.name ?? 'Freelancer',
      freelancerAddress,
      proposal: proposal.trim(),
      rate: `${rate} ${job!.token}`,
    }, profile?.role);
    setApplying(false);
    setShowApplyForm(false);
    await reload();
  }

  async function handleAccept(app: JobApplication) {
    await marketplace.acceptApplication(job!.id, app.id, user?.id);
    await reload();
  }

  async function handleReject(app: JobApplication) {
    await marketplace.rejectApplication(job!.id, app.id, user?.id);
    await reload();
  }

  function handleHire(app: JobApplication) {
    // Navigate to create contract with freelancer pre-filled
    navigate(`/dashboard/create?freelancer=${app.freelancerAddress}&jobTitle=${encodeURIComponent(job!.title)}`);
  }

  const APP_STATUS: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    accepted: { label: 'Accepted',       color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    rejected: { label: 'Rejected',       color: 'text-gray-500 bg-white/5 border-white/10' },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/jobs" className="hover:text-gray-300 transition-colors">Job board</Link>
          <span>/</span>
          <span className="text-gray-300 font-medium line-clamp-1">{job.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Main */}
          <div className="space-y-5">
            {/* Job header */}
            <div className="feature-card p-6">
              <div className="flex items-start gap-3 flex-wrap mb-4">
                <h1 className="text-xl font-extrabold text-gray-50 flex-1">{job.title}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  job.status === 'open' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                  job.status === 'in_progress' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                  'text-gray-500 bg-white/5 border-white/10'
                }`}>
                  {job.status === 'open' ? 'Open' : job.status === 'in_progress' ? 'In progress' : 'Closed'}
                </span>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line mb-5">{job.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {job.skills.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Clients can't apply — show informational nudge */}
            {!isFreelancer && !isClient && profile && (
              <div className="feature-card p-5 flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-amber-400 shrink-0">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-300">
                  Your account is registered as a <strong>client</strong>. Only freelancers can apply to jobs.
                </p>
              </div>
            )}

            {/* Apply section (freelancer) */}
            {isFreelancer && job.status === 'open' && !isClient && (
              <div className="feature-card p-6">
                {myApp ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-green-400">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold text-gray-200">Your proposal was sent</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${APP_STATUS[myApp.status].color}`}>
                        {APP_STATUS[myApp.status].label}
                      </span>
                      <span className="text-sm text-gray-500">Rate: <span className="text-gray-300 font-medium">{myApp.rate}</span></span>
                    </div>
                    {myApp.status === 'accepted' && (
                      <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-300">
                        The client accepted your proposal. Waiting for them to create the escrow contract.
                      </div>
                    )}
                  </div>
                ) : showApplyForm ? (
                  <form onSubmit={handleApply} className="space-y-5" noValidate>
                    <h3 className="font-semibold text-gray-100 text-base">Send a proposal</h3>

                    {!freelancerAddress && (
                      <div className="text-xs text-amber-300 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                        Connect your Starknet wallet from the dashboard before applying.
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your proposal</label>
                      <textarea
                        value={proposal}
                        onChange={e => setProposal(e.target.value)}
                        rows={5}
                        placeholder="Describe why you're the right person for this job. Mention relevant experience, your approach, and what you'll deliver…"
                        className={`input-dark resize-none ${errors.proposal ? 'input-dark-error' : ''}`}
                      />
                      {errors.proposal && <p className="mt-1.5 text-xs text-red-400">{errors.proposal}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Your rate ({job.token})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rate}
                          onChange={e => setRate(e.target.value)}
                          placeholder="e.g. 800"
                          min="0"
                          className={`input-dark pr-16 ${errors.rate ? 'input-dark-error' : ''}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600 pointer-events-none">{job.token}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">Budget range: {job.budgetMin}–{job.budgetMax} {job.token}</p>
                      {errors.rate && <p className="mt-1 text-xs text-red-400">{errors.rate}</p>}
                    </div>

                    <div className="flex gap-3">
                      <button type="submit" disabled={applying} className="btn-primary flex-1 py-3 text-sm">
                        {applying ? 'Submitting…' : 'Submit proposal'}
                      </button>
                      <button type="button" onClick={() => setShowApplyForm(false)} className="btn-ghost px-5 py-3">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-200">Interested in this job?</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Submit a proposal and the client will review it.</p>
                    </div>
                    <button onClick={() => setShowApplyForm(true)} className="btn-primary py-2.5 text-sm whitespace-nowrap">
                      Apply now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Proposals (client only) */}
            {isClient && (
              <div className="feature-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="font-semibold text-gray-200 text-sm">
                    Proposals <span className="text-gray-600">({job.applications.length})</span>
                  </h3>
                </div>

                {job.applications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-sm">No proposals yet. Freelancers will apply here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {job.applications.map(app => {
                      const appSt = APP_STATUS[app.status];
                      return (
                        <div key={app.id} className="px-6 py-5">
                          <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm shrink-0">
                              {app.freelancerName[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-gray-200 text-sm">{app.freelancerName}</span>
                                <span className="font-mono text-xs text-gray-600">{shortAddr(app.freelancerAddress)}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${appSt.color}`}>
                                  {appSt.label}
                                </span>
                                <span className="text-xs text-gray-600 ml-auto">{timeAgo(app.createdAt)}</span>
                              </div>

                              <p className="text-sm text-gray-400 leading-relaxed mt-2 mb-3">{app.proposal}</p>

                              <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-gray-100">
                                  {app.rate}
                                </span>

                                {app.status === 'pending' && job.status === 'open' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAccept(app)}
                                      className="btn-primary py-1.5 px-3 text-xs"
                                    >
                                      Accept &amp; hire
                                    </button>
                                    <button
                                      onClick={() => handleReject(app)}
                                      className="py-1.5 px-3 text-xs rounded-xl border border-white/[0.08] text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}

                                {app.status === 'accepted' && (
                                  <button
                                    onClick={() => handleHire(app)}
                                    className="btn-primary py-1.5 px-3 text-xs"
                                  >
                                    Create escrow contract →
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Job details */}
            <div className="feature-card p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Job details</h3>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="text-sm font-bold text-gray-100">
                    {job.budgetMin}–{job.budgetMax} <span className="text-brand-400">{job.token}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deadline</span>
                  <span className="text-sm text-gray-300">
                    {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Posted</span>
                  <span className="text-sm text-gray-300">{timeAgo(job.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Proposals</span>
                  <span className="text-sm text-gray-300">{job.applications.length}</span>
                </div>
                {acceptedApp && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hired</span>
                    <span className="text-sm font-medium text-green-400">{acceptedApp.freelancerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Client info */}
            <div className="feature-card p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Client</h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm">
                  {job.clientName[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{job.clientName}</p>
                  <p className="text-xs font-mono text-gray-600">{shortAddr(job.clientAddress)}</p>
                </div>
              </div>
            </div>

            {/* Escrow protection badge */}
            <div className="feature-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5L2 5.25V9C2 12.45 5.08 15.67 9 16.5C12.92 15.67 16 12.45 16 9V5.25L9 1.5Z" fill="#4f46e5" fillOpacity="0.3" />
                  <path d="M6.5 9L8.25 10.75L11.75 7.25" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-semibold text-brand-300">Escrow protected</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Payment is locked in a Starknet smart contract when the client hires. Released only when work is approved.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
