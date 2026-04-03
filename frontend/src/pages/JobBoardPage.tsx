import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile } from '../hooks/useProfile';
import { marketplace, type Job } from '../lib/marketplace';
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

function daysLeft(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

const STATUS_COLORS: Record<string, string> = {
  open:        'text-green-400 bg-green-500/10 border-green-500/20',
  in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  completed:   'text-gray-400 bg-white/5 border-white/10',
  cancelled:   'text-red-400 bg-red-500/10 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
};

type FilterStatus = 'all' | 'open' | 'in_progress';
type SortBy = 'newest' | 'deadline' | 'budget';

export default function JobBoardPage() {
  const { user } = usePrivy();
  const { profile } = useProfile(user?.id ?? null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('open');
  const [filterSkill, setFilterSkill] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  useEffect(() => {
    setJobs(marketplace.getJobs());
  }, []);

  const allSkills = [...new Set(jobs.flatMap(j => j.skills))].sort();

  const filtered = jobs
    .filter(j => {
      if (filterStatus !== 'all' && j.status !== filterStatus) return false;
      if (filterSkill && !j.skills.includes(filterSkill)) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.skills.some(s => s.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === 'budget') return Number(b.budgetMax) - Number(a.budgetMax);
      return 0;
    });

  const isClient = profile?.role === 'client';

  return (
    <div className="min-h-screen flex flex-col bg-[#09090f]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-50">Job board</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} job{filtered.length !== 1 ? 's' : ''} available · Starknet Sepolia
            </p>
          </div>
          {isClient && (
            <Link to="/jobs/post" className="btn-primary py-2.5 text-sm whitespace-nowrap">
              + Post a job
            </Link>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0 space-y-5">
            {/* Status filter */}
            <div className="feature-card p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</p>
              <div className="space-y-1">
                {([['all', 'All jobs'], ['open', 'Open'], ['in_progress', 'In progress']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterStatus(val)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filterStatus === val
                        ? 'bg-brand-500/15 text-brand-300 font-medium'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="feature-card p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sort by</p>
              <div className="space-y-1">
                {([['newest', 'Newest first'], ['deadline', 'Deadline soon'], ['budget', 'Highest budget']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSortBy(val)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      sortBy === val
                        ? 'bg-brand-500/15 text-brand-300 font-medium'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Skills filter */}
            {allSkills.length > 0 && (
              <div className="feature-card p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by skill</p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => setFilterSkill('')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      !filterSkill ? 'bg-brand-500/15 text-brand-300 font-medium' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >All skills</button>
                  {allSkills.map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterSkill(filterSkill === s ? '' : s)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        filterSkill === s ? 'bg-brand-500/15 text-brand-300 font-medium' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Job list */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="relative mb-5">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="9" r="6" />
                <path strokeLinecap="round" d="M15 15l3 3" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search jobs by title, skill, or keyword…"
                className="input-dark pl-10"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="feature-card p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">No jobs found</p>
                <p className="text-sm text-gray-600 mt-1">
                  {isClient ? 'Be the first to post a job.' : 'Check back soon or adjust your filters.'}
                </p>
                {isClient && (
                  <Link to="/jobs/post" className="mt-4 btn-primary py-2 text-sm inline-flex">
                    Post a job
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(job => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="feature-card p-5 block group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap mb-2">
                          <h3 className="font-semibold text-gray-100 text-base group-hover:text-brand-300 transition-colors leading-snug">
                            {job.title}
                          </h3>
                          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[job.status]}`}>
                            {STATUS_LABELS[job.status]}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {job.skills.map(s => (
                            <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-gray-400">
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
                          <span>By <span className="text-gray-400 font-medium">{job.clientName}</span></span>
                          <span>{job.applications.length} proposal{job.applications.length !== 1 ? 's' : ''}</span>
                          <span>{timeAgo(job.createdAt)}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-gray-100">
                          {job.budgetMin}–{job.budgetMax}
                          <span className="text-brand-400 font-semibold ml-1">{job.token}</span>
                        </p>
                        <p className={`text-xs mt-1 font-medium ${
                          daysLeft(job.deadline) === 'Expired' ? 'text-red-400' : 'text-gray-500'
                        }`}>
                          {daysLeft(job.deadline)}
                        </p>
                        <svg className="ml-auto mt-3 text-gray-700 group-hover:text-brand-400 transition-colors" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
