import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'freelancer' | 'client';

export interface UserProfile {
  role: UserRole;
  displayName: string;
  nickname?: string;
  bio?: string;
  starknetAddress: string;
  xLink?: string;
  tgLink?: string;
  discordLink?: string;
}

// localStorage key for fast local reads (same device)
const localKey = (userId: string) => `escrowhub_profile_${userId}`;

// Supabase table
const PROFILES_TABLE = 'escrowhub_profiles';

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  // 1. Try localStorage first (instant)
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* ignore */ }

  // 2. Fall back to Supabase (cross-device)
  try {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('*')
      .eq('userId', userId)
      .single();

    if (data && !error) {
      const p = data as UserProfile;
      // Cache locally
      localStorage.setItem(localKey(userId), JSON.stringify(p));
      return p;
    }
  } catch { /* ignore */ }

  return null;
}

export function useProfile(userId: string | null) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!userId) { setProfileState(null); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    fetchProfile(userId).then(p => {
      if (!cancelled) {
        setProfileState(p);
        setLoading(false);
      }
    });

    const handleUpdate = () => {
      fetchProfile(userId).then(p => { if (!cancelled) setProfileState(p); });
    };
    window.addEventListener(`profile_updated_${userId}`, handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(`profile_updated_${userId}`, handleUpdate);
    };
  }, [userId]);

  const saveProfile = useCallback(
    async (data: UserProfile): Promise<boolean> => {
      if (!userId) return false;
      // Save to localStorage (immediate)
      localStorage.setItem(localKey(userId), JSON.stringify(data));
      setProfileState(data);
      window.dispatchEvent(new Event(`profile_updated_${userId}`));
      
      // Sync to Supabase (shared)
      try {
        console.log(`[useProfile] Syncing profile for ${userId} to Supabase...`);
        const { error } = await supabase
          .from(PROFILES_TABLE)
          .upsert({ ...data, userId });
        
        if (error) {
          console.error('[useProfile] Supabase sync error:', error.message);
          return false;
        }
        
        console.log(`[useProfile] Successfully synced profile for ${userId}`);
        return true;
      } catch (e) {
        console.error('[useProfile] Unexpected sync error:', e);
        return false;
      }
    },
    [userId],
  );

  const clearProfile = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(localKey(userId));
    setProfileState(null);
    window.dispatchEvent(new Event(`profile_updated_${userId}`));
  }, [userId]);

  return { profile, loading, saveProfile, clearProfile };
}
