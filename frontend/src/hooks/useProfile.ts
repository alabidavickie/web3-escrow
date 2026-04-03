import { useState, useEffect, useCallback } from 'react';

export type UserRole = 'freelancer' | 'client';

export interface UserProfile {
  role: UserRole;
  displayName: string;
  bio?: string;
  starknetAddress: string;
}

const storageKey = (userId: string) => `escrowhub_profile_${userId}`;

export function useProfile(userId: string | null) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const loadProfile = () => {
      if (!userId) {
        setProfileState(null);
        setLoading(false);
        return;
      }
      try {
        const raw = localStorage.getItem(storageKey(userId));
        setProfileState(raw ? JSON.parse(raw) : null);
      } catch {
        setProfileState(null);
      }
      setLoading(false);
    };

    loadProfile();

    // Event listener for cross-hook synchronization
    const handleUpdate = () => loadProfile();
    window.addEventListener(`profile_updated_${userId}`, handleUpdate);
    return () => window.removeEventListener(`profile_updated_${userId}`, handleUpdate);
  }, [userId]);

  const saveProfile = useCallback(
    (data: UserProfile) => {
      if (!userId) return;
      localStorage.setItem(storageKey(userId), JSON.stringify(data));
      setProfileState(data);
      window.dispatchEvent(new Event(`profile_updated_${userId}`));
    },
    [userId],
  );

  const clearProfile = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(storageKey(userId));
    setProfileState(null);
    window.dispatchEvent(new Event(`profile_updated_${userId}`));
  }, [userId]);

  return { profile, loading, saveProfile, clearProfile };
}
