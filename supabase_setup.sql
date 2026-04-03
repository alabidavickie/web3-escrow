-- ==========================================
-- EscrowHub Supabase Schema & Security Setup
-- ==========================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.escrowhub_profiles (
    "userId" TEXT PRIMARY KEY,
    "role" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "nickname" TEXT,
    "bio" TEXT,
    "starknetAddress" TEXT NOT NULL,
    "xLink" TEXT,
    "tgLink" TEXT,
    "discordLink" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Jobs Table
CREATE TABLE IF NOT EXISTS public.escrowhub_jobs (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "skills" TEXT[] DEFAULT '{}',
    "budgetMin" TEXT NOT NULL,
    "budgetMax" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "status" TEXT DEFAULT 'open',
    "applications" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Offers Table
CREATE TABLE IF NOT EXISTS public.escrowhub_offers (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "freelancerName" TEXT NOT NULL,
    "freelancerAddress" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "duration" TEXT,
    "milestones" JSONB DEFAULT '[]',
    "token" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.escrowhub_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrowhub_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrowhub_offers ENABLE ROW LEVEL SECURITY;

-- 5. Define Policies

-- Profiles: Anyone can read profiles
CREATE POLICY "Public Read Profiles" ON public.escrowhub_profiles
    FOR SELECT USING (true);

-- Profiles: Users can upsert their own profile
CREATE POLICY "Users Manage Own Profile" ON public.escrowhub_profiles
    FOR ALL USING (true); -- Simplified for initial setup; can be narrowed to userId check if using Supabase Auth

-- Jobs: Anyone can read jobs
CREATE POLICY "Public Read Jobs" ON public.escrowhub_jobs
    FOR SELECT USING (true);

-- Jobs: Anyone can insert jobs (simplified for testing, ideally check client role)
CREATE POLICY "Public Insert Jobs" ON public.escrowhub_jobs
    FOR INSERT WITH CHECK (true);

-- Jobs: Anyone can update jobs (needed for applications; simplified)
CREATE POLICY "Public Update Jobs" ON public.escrowhub_jobs
    FOR UPDATE USING (true);

-- Offers: Only involved parties should read (simplified to public for beta)
CREATE POLICY "Public Read Offers" ON public.escrowhub_offers
    FOR SELECT USING (true);

-- Offers: Anyone can insert offers
CREATE POLICY "Public Insert Offers" ON public.escrowhub_offers
    FOR INSERT WITH CHECK (true);

-- Offers: Anyone can update offers
CREATE POLICY "Public Update Offers" ON public.escrowhub_offers
    FOR UPDATE USING (true);
