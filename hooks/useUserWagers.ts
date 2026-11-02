'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { cacheService } from '@/services/cacheService';

// Define the type for a single wager returned from the API
export interface UserWager {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: 'open' | 'closed';
  createdAt: string;
  wagerAmount: number;
  optionSelected: string;
  totalOnSelectedOption: number;
  totalPool: number;
}

// Define the hook's return type for better type-safety
interface UseUserWagersReturn {
  wagers: UserWager[];
  isLoading: boolean;
  error: string | null;
  fetchUserWagers: (status?: 'open' | 'closed') => Promise<void>;
}

const WAGERS_CACHE_KEY = 'user_wagers';
const WAGERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook to fetch a user's participated wagers from the API.
 * It handles loading, error states, and caches the response.
 * @param initialStatus Optional status filter for the wagers.
 */
export function useUserWagers(initialStatus?: 'open' | 'closed'): UseUserWagersReturn {
  const [wagers, setWagers] = useState<UserWager[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session, status: authStatus } = useSession();

  /**
   * Function to fetch wagers from the API. It can be called manually.
   * @param status Optional status to filter by. Defaults to the hook's initial status.
   */
  const fetchUserWagers = useCallback(async (status?: 'open' | 'closed') => {
    // If auth is still loading, do nothing
    if (authStatus === 'loading') return;

    const userId = session?.user?.id;
    if (!userId) {
      setError('User not authenticated.');
      return;
    }

    const currentStatus = status || initialStatus;
    const cacheKey = `${WAGERS_CACHE_KEY}_${userId}_${currentStatus}`;

    // Check for cached data first
    const cachedData = cacheService.get<UserWager[]>(cacheKey, WAGERS_CACHE_DURATION);
    if (cachedData) {
      setWagers(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      if (currentStatus) {
        params.append('status', currentStatus);
      }

      const res = await fetch(`/api/users/wagers?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch wagers');
      }

      setWagers(result.wagers);
      cacheService.set(cacheKey, result.wagers);
    } catch (err) {
      console.error('Error fetching wagers:', err);
      setError('Failed to load your wagers. Please try again.');
      setWagers([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, initialStatus, authStatus]);

  // Fetch wagers when the user session or initial status changes
  useEffect(() => {
    fetchUserWagers();
  }, [fetchUserWagers]);

  return {
    wagers,
    isLoading,
    error,
    fetchUserWagers,
  };
}
