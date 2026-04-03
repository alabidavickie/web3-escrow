// ============================================================
// EscrowHub — localStorage-backed job marketplace
// ============================================================

export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AppStatus = 'pending' | 'accepted' | 'rejected';

export interface JobApplication {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAddress: string;
  proposal: string;
  rate: string;              // e.g. "500 STRK"
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
  skills: string[];
  budgetMin: string;
  budgetMax: string;
  token: 'STRK' | 'USDC';
  deadline: string;          // ISO date string
  status: JobStatus;
  createdAt: string;
  applications: JobApplication[];
}

const JOBS_KEY = 'escrowhub_jobs_v1';

function readAll(): Job[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(jobs: Job[]): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export const marketplace = {
  // ── Read ──────────────────────────────────────────────────
  getJobs(): Job[] {
    return readAll();
  },

  getOpenJobs(): Job[] {
    return readAll().filter(j => j.status === 'open');
  },

  getJobById(id: string): Job | null {
    return readAll().find(j => j.id === id) ?? null;
  },

  getJobsByClient(clientId: string): Job[] {
    return readAll().filter(j => j.clientId === clientId);
  },

  getApplicationsByFreelancer(freelancerId: string): JobApplication[] {
    return readAll().flatMap(j =>
      j.applications.filter(a => a.freelancerId === freelancerId).map(a => ({ ...a, _jobTitle: j.title }))
    );
  },

  // ── Write ─────────────────────────────────────────────────
  postJob(data: Omit<Job, 'id' | 'createdAt' | 'applications' | 'status'>): Job {
    const jobs = readAll();
    const job: Job = {
      ...data,
      id: crypto.randomUUID(),
      status: 'open',
      applications: [],
      createdAt: new Date().toISOString(),
    };
    writeAll([job, ...jobs]);
    return job;
  },

  applyToJob(
    jobId: string,
    data: Omit<JobApplication, 'id' | 'jobId' | 'status' | 'createdAt'>
  ): JobApplication | null {
    const jobs = readAll();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return null;

    // Prevent duplicate applications
    if (jobs[idx].applications.some(a => a.freelancerId === data.freelancerId)) return null;

    const app: JobApplication = {
      ...data,
      id: crypto.randomUUID(),
      jobId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    jobs[idx].applications.push(app);
    writeAll(jobs);
    return app;
  },

  acceptApplication(jobId: string, appId: string): Job | null {
    const jobs = readAll();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return null;

    jobs[idx].applications = jobs[idx].applications.map(a => ({
      ...a,
      status: a.id === appId ? 'accepted' : 'rejected',
    }));
    jobs[idx].status = 'in_progress';
    writeAll(jobs);
    return jobs[idx];
  },

  rejectApplication(jobId: string, appId: string): void {
    const jobs = readAll();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return;
    jobs[idx].applications = jobs[idx].applications.map(a =>
      a.id === appId ? { ...a, status: 'rejected' } : a
    );
    writeAll(jobs);
  },

  markCompleted(jobId: string): void {
    const jobs = readAll();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) { jobs[idx].status = 'completed'; writeAll(jobs); }
  },

  cancelJob(jobId: string): void {
    const jobs = readAll();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) { jobs[idx].status = 'cancelled'; writeAll(jobs); }
  },
};
