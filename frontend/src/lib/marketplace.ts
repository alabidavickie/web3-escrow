// ============================================================
// EscrowHub — localStorage-backed job marketplace + contract offers
// ============================================================

export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AppStatus = 'pending' | 'accepted' | 'rejected';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'contracted';

export interface JobApplication {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAddress: string;
  proposal: string;
  rate: string;
  status: AppStatus;
  createdAt: string;
}

export interface Job {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  title: string;
  description: string;
  category?: string;
  skills: string[];
  budgetMin: string;
  budgetMax: string;
  token: 'STRK' | 'USDC';
  deadline: string;
  status: JobStatus;
  createdAt: string;
  applications: JobApplication[];
}

// A direct contract offer from client to a specific freelancer
export interface MilestoneOffer {
  description: string;
  amount: string;
  token: 'STRK' | 'USDC';
}

export interface ContractOffer {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAddress: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  milestones: MilestoneOffer[];
  token: 'STRK' | 'USDC';
  totalAmount: string;
  status: OfferStatus;
  createdAt: string;
}

// ── Keys ──────────────────────────────────────────────────────────────────────

const JOBS_KEY   = 'escrowhub_jobs_v1';
const OFFERS_KEY = 'escrowhub_offers_v1';

// ── Storage helpers ───────────────────────────────────────────────────────────

function readJobs(): Job[] {
  try { return JSON.parse(localStorage.getItem(JOBS_KEY) ?? '[]'); } catch { return []; }
}
function writeJobs(jobs: Job[]) { localStorage.setItem(JOBS_KEY, JSON.stringify(jobs)); }

function readOffers(): ContractOffer[] {
  try { return JSON.parse(localStorage.getItem(OFFERS_KEY) ?? '[]'); } catch { return []; }
}
function writeOffers(offers: ContractOffer[]) { localStorage.setItem(OFFERS_KEY, JSON.stringify(offers)); }

// ── Marketplace API ───────────────────────────────────────────────────────────

export const marketplace = {

  // ─── Jobs ────────────────────────────────────────────────────────────────

  getJobs(): Job[] { return readJobs(); },
  getOpenJobs(): Job[] { return readJobs().filter(j => j.status === 'open'); },
  getJobById(id: string): Job | null { return readJobs().find(j => j.id === id) ?? null; },
  getJobsByClient(clientId: string): Job[] { return readJobs().filter(j => j.clientId === clientId); },

  getApplicationsByFreelancer(freelancerId: string): (JobApplication & { jobTitle: string })[] {
    return readJobs().flatMap(j =>
      j.applications
        .filter(a => a.freelancerId === freelancerId)
        .map(a => ({ ...a, jobTitle: j.title }))
    );
  },

  postJob(data: Omit<Job, 'id' | 'createdAt' | 'applications' | 'status'>): Job {
    const jobs = readJobs();
    const job: Job = { ...data, id: crypto.randomUUID(), status: 'open', applications: [], createdAt: new Date().toISOString() };
    writeJobs([job, ...jobs]);
    return job;
  },

  applyToJob(jobId: string, data: Omit<JobApplication, 'id' | 'jobId' | 'status' | 'createdAt'>): JobApplication | null {
    const jobs = readJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return null;
    if (jobs[idx].applications.some(a => a.freelancerId === data.freelancerId)) return null;
    const app: JobApplication = { ...data, id: crypto.randomUUID(), jobId, status: 'pending', createdAt: new Date().toISOString() };
    jobs[idx].applications.push(app);
    writeJobs(jobs);
    return app;
  },

  acceptApplication(jobId: string, appId: string): Job | null {
    const jobs = readJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return null;
    jobs[idx].applications = jobs[idx].applications.map(a => ({
      ...a, status: a.id === appId ? 'accepted' : 'rejected',
    }));
    jobs[idx].status = 'in_progress';
    writeJobs(jobs);
    return jobs[idx];
  },

  rejectApplication(jobId: string, appId: string): void {
    const jobs = readJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return;
    jobs[idx].applications = jobs[idx].applications.map(a =>
      a.id === appId ? { ...a, status: 'rejected' } : a
    );
    writeJobs(jobs);
  },

  markCompleted(jobId: string): void {
    const jobs = readJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) { jobs[idx].status = 'completed'; writeJobs(jobs); }
  },

  cancelJob(jobId: string): void {
    const jobs = readJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) { jobs[idx].status = 'cancelled'; writeJobs(jobs); }
  },

  // ─── Contract Offers (client → freelancer direct) ────────────────────────

  getOffers(): ContractOffer[] { return readOffers(); },

  getOffersForFreelancer(freelancerId: string): ContractOffer[] {
    return readOffers().filter(o => o.freelancerId === freelancerId);
  },

  getOffersByClient(clientId: string): ContractOffer[] {
    return readOffers().filter(o => o.clientId === clientId);
  },

  getOfferById(id: string): ContractOffer | null {
    return readOffers().find(o => o.id === id) ?? null;
  },

  sendOffer(data: Omit<ContractOffer, 'id' | 'createdAt' | 'status'>): ContractOffer {
    const offers = readOffers();
    const offer: ContractOffer = { ...data, id: crypto.randomUUID(), status: 'pending', createdAt: new Date().toISOString() };
    writeOffers([offer, ...offers]);
    return offer;
  },

  acceptOffer(offerId: string): ContractOffer | null {
    const offers = readOffers();
    const idx = offers.findIndex(o => o.id === offerId);
    if (idx === -1) return null;
    offers[idx].status = 'accepted';
    writeOffers(offers);
    return offers[idx];
  },

  declineOffer(offerId: string): void {
    const offers = readOffers();
    const idx = offers.findIndex(o => o.id === offerId);
    if (idx !== -1) { offers[idx].status = 'declined'; writeOffers(offers); }
  },

  markOfferContracted(offerId: string): void {
    const offers = readOffers();
    const idx = offers.findIndex(o => o.id === offerId);
    if (idx !== -1) { offers[idx].status = 'contracted'; writeOffers(offers); }
  },
};
