// ============================================================
// EscrowHub — Supabase-backed job marketplace + contract offers
// All data is shared across users in real time.
// ============================================================

import { supabase } from './supabase';

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

const JOBS_TABLE = 'escrowhub_jobs';
const OFFERS_TABLE = 'escrowhub_offers';

export const marketplace = {

  // ─── Jobs ────────────────────────────────────────────────────────────────

  async getJobs(): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from(JOBS_TABLE)
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        skills: d.skills || [],
        applications: d.applications || [],
      }));
    } catch (err) {
      console.error('[Marketplace] Error fetching jobs:', err);
      return [];
    }
  },

  async getOpenJobs(): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from(JOBS_TABLE)
        .select('*')
        .eq('status', 'open')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        skills: d.skills || [],
        applications: d.applications || [],
      }));
    } catch (err) {
      console.error('[Marketplace] Error fetching open jobs:', err);
      const all = await this.getJobs();
      return all.filter(j => j.status === 'open');
    }
  },

  async getJobById(id: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from(JOBS_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return {
        ...data,
        skills: data.skills || [],
        applications: data.applications || [],
      };
    } catch {
      return null;
    }
  },

  async getJobsByClient(clientId: string): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from(JOBS_TABLE)
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        skills: d.skills || [],
        applications: d.applications || [],
      }));
    } catch {
      return [];
    }
  },

  async getApplicationsByFreelancer(
    freelancerId: string,
  ): Promise<(JobApplication & { jobTitle: string })[]> {
    const jobs = await this.getJobs();
    return jobs.flatMap(j =>
      (j.applications || [])
        .filter(a => a.freelancerId === freelancerId)
        .map(a => ({ ...a, jobTitle: j.title })),
    );
  },

  async postJob(
    data: Omit<Job, 'id' | 'createdAt' | 'applications' | 'status'>,
    callerRole?: string,
  ): Promise<Job | null> {
    if (callerRole && callerRole !== 'client') {
      console.warn('[Marketplace] Only clients can post jobs.');
      return null;
    }
    
    const payload = {
      ...data,
      status: 'open',
      applications: [],
      createdAt: new Date().toISOString(),
    };

    try {
      console.log('[Marketplace] Posting job to Supabase...');
      const { data: inserted, error } = await supabase
        .from(JOBS_TABLE)
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        console.error('[Marketplace] Supabase insert error:', error.message);
        return null;
      }
      return inserted;
    } catch (err) {
      console.error('[Marketplace] Unexpected error posting job:', err);
      return null;
    }
  },

  async applyToJob(
    jobId: string,
    data: Omit<JobApplication, 'id' | 'jobId' | 'status' | 'createdAt'>,
    callerRole?: string,
  ): Promise<JobApplication | null> {
    if (callerRole && callerRole !== 'freelancer') {
      console.warn('[Marketplace] Only freelancers can apply to jobs.');
      return null;
    }
    
    const job = await this.getJobById(jobId);
    if (!job) {
      console.error('[Marketplace] Job not found for application:', jobId);
      return null;
    }
    
    // Check if the freelancer is also the client
    if (job.clientId === data.freelancerId) {
      console.warn('[Marketplace] Clients cannot apply to their own jobs.');
      return null;
    }
    
    const apps = Array.isArray(job.applications) ? job.applications : [];
    if (apps.some(a => a.freelancerId === data.freelancerId)) {
      console.warn('[Marketplace] Freelancer has already applied to this job.');
      return null;
    }

    const newApp: JobApplication = {
      ...data,
      id: crypto.randomUUID(),
      jobId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      console.log(`[Marketplace] Applying to job ${jobId}...`);
      const { error } = await supabase
        .from(JOBS_TABLE)
        .update({ applications: [...apps, newApp] })
        .eq('id', jobId);
      
      if (error) {
        console.error('[Marketplace] Supabase update application error:', error.message);
        return null;
      }
      return newApp;
    } catch (err) {
      console.error('[Marketplace] Unexpected error applying to job:', err);
      return null;
    }
  },

  async acceptApplication(
    jobId: string,
    appId: string,
    callerId?: string,
  ): Promise<Job | null> {
    const job = await this.getJobById(jobId);
    if (!job) return null;
    if (callerId && job.clientId !== callerId) return null;

    const apps = (job.applications || []).map(
      (a: JobApplication) => ({ ...a, status: a.id === appId ? 'accepted' : 'rejected' }),
    );

    try {
      const { data: updated, error } = await supabase
        .from(JOBS_TABLE)
        .update({ applications: apps, status: 'in_progress' })
        .eq('id', jobId)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    } catch (err) {
      console.error('[Marketplace] Error accepting application:', err);
      return null;
    }
  },

  async rejectApplication(
    jobId: string,
    appId: string,
    callerId?: string,
  ): Promise<void> {
    const job = await this.getJobById(jobId);
    if (!job) return;
    if (callerId && job.clientId !== callerId) return;

    const apps = (job.applications || []).map(
      (a: JobApplication) => a.id === appId ? { ...a, status: 'rejected' } : a,
    );

    try {
      await supabase
        .from(JOBS_TABLE)
        .update({ applications: apps })
        .eq('id', jobId);
    } catch (err) {
      console.error('[Marketplace] Error rejecting application:', err);
    }
  },

  async markCompleted(jobId: string): Promise<void> {
    try {
      await supabase.from(JOBS_TABLE).update({ status: 'completed' }).eq('id', jobId);
    } catch {}
  },

  async cancelJob(jobId: string): Promise<void> {
    try {
      await supabase.from(JOBS_TABLE).update({ status: 'cancelled' }).eq('id', jobId);
    } catch {}
  },

  // ─── Contract Offers ─────────────────────────────────────────────────────

  async getOffers(): Promise<ContractOffer[]> {
    try {
      const { data, error } = await supabase
        .from(OFFERS_TABLE)
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async getOffersForFreelancer(freelancerId: string): Promise<ContractOffer[]> {
    try {
      const { data, error } = await supabase
        .from(OFFERS_TABLE)
        .select('*')
        .eq('freelancerId', freelancerId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async getOffersByClient(clientId: string): Promise<ContractOffer[]> {
    try {
      const { data, error } = await supabase
        .from(OFFERS_TABLE)
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  async getOfferById(id: string): Promise<ContractOffer | null> {
    try {
      const { data, error } = await supabase
        .from(OFFERS_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },

  async sendOffer(
    data: Omit<ContractOffer, 'id' | 'createdAt' | 'status'>,
    callerRole?: string,
  ): Promise<ContractOffer | null> {
    if (callerRole && callerRole !== 'client') return null;
    if (data.clientId === data.freelancerId) return null;

    const payload = {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const { data: inserted, error } = await supabase
        .from(OFFERS_TABLE)
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return inserted;
    } catch (err) {
      console.error('[Marketplace] Error sending offer:', err);
      return null;
    }
  },

  async acceptOffer(offerId: string, callerId?: string): Promise<ContractOffer | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from(OFFERS_TABLE)
        .select('*')
        .eq('id', offerId)
        .single();
      
      if (fetchError || !data) return null;
      if (callerId && data.freelancerId !== callerId) return null;

      const { data: updated, error: updateError } = await supabase
        .from(OFFERS_TABLE)
        .update({ status: 'accepted' })
        .eq('id', offerId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updated;
    } catch (err) {
      console.error('[Marketplace] Error accepting offer:', err);
      return null;
    }
  },

  async declineOffer(offerId: string, callerId?: string): Promise<void> {
    try {
      const { data } = await supabase
        .from(OFFERS_TABLE)
        .select('freelancerId')
        .eq('id', offerId)
        .single();
      
      if (!data) return;
      if (callerId && data.freelancerId !== callerId) return;

      await supabase.from(OFFERS_TABLE).update({ status: 'declined' }).eq('id', offerId);
    } catch {}
  },

  async markOfferContracted(offerId: string): Promise<void> {
    try {
      await supabase.from(OFFERS_TABLE).update({ status: 'contracted' }).eq('id', offerId);
    } catch {}
  },
};
