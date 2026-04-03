import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface FreelancerProfile {
  userId: string;
  displayName: string;
  bio?: string;
  starknetAddress: string;
  role: string;
}

function getAllFreelancers(): FreelancerProfile[] {
  const profiles: FreelancerProfile[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('escrowhub_profile_')) continue;
    try {
      const p = JSON.parse(localStorage.getItem(key) ?? '');
      if (p?.role === 'freelancer') {
        profiles.push({ ...p, userId: key.replace('escrowhub_profile_', '') });
      }
    } catch { /* skip */ }
  }
  return profiles;
}

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

const AVATAR_COLORS = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
];

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setFreelancers(getAllFreelancers());
  }, []);

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = freelancers.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.displayName.toLowerCase().includes(q) || f.bio?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-50">Freelancers</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} registered freelancer{filtered.length !== 1 ? 's' : ''} on EscrowHub
            </p>
          </div>
          <Link to="/jobs/post" className="btn-primary py-2.5 text-sm whitespace-nowrap">
            + Post a job
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="6" /><path strokeLinecap="round" d="M15 15l3 3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or bio…"
            className="input-dark pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="feature-card p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
                <path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">No freelancers found</p>
            <p className="text-sm text-gray-600 mt-1">
              {search ? 'Try a different search.' : 'Freelancers who register on EscrowHub will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f, idx) => {
              const gradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div key={f.userId} className="feature-card p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {f.displayName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-100 truncate">{f.displayName}</p>
                      <p className="text-xs text-gray-500">Freelancer</p>
                    </div>
                  </div>

                  {f.bio && (
                    <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2 flex-1">{f.bio}</p>
                  )}

                  <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyAddress(f.starknetAddress)}
                      className="flex items-center gap-1.5 text-xs font-mono text-gray-600 hover:text-gray-300 transition-colors truncate"
                      title={f.starknetAddress}
                    >
                      {copied === f.starknetAddress ? (
                        <span className="text-green-400">Copied!</span>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                            <path d="M4 2h7a2 2 0 012 2v9a1 1 0 01-1 1H4a2 2 0 01-2-2V4a2 2 0 012-2zm0 1a1 1 0 00-1 1v8a1 1 0 001 1h7a1 1 0 001-1V4a1 1 0 00-1-1H4z" />
                            <path d="M6 1h7a1 1 0 011 1v9a1 1 0 01-1 1H6" fillOpacity="0.4" />
                          </svg>
                          {shortAddr(f.starknetAddress)}
                        </>
                      )}
                    </button>

                    <Link
                      to={`/dashboard/create?freelancer=${f.starknetAddress}`}
                      className="shrink-0 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors px-2.5 py-1.5 rounded-lg border border-brand-500/20 hover:border-brand-500/40 hover:bg-brand-500/5"
                    >
                      Hire →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
