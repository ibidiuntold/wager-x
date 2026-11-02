import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useCallback } from 'react';

// The cache will now only store the wallet data
const CACHE_DURATION = 5 * 60 * 1000;
const walletDataCache: Record<string, any> = {};
const pendingFetches: Record<string, boolean> = {};

export const useWalletData = ({ skipCache = false }: { skipCache?: boolean } = {}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status: authStatus } = useSession();

  // Memoize userId to prevent unnecessary re-computations
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  const [userData, setUserData] = useState<any | null>(null);

  // Use useCallback to memoize fetchData function
  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    if (pendingFetches[userId]) {
      return;
    }

    try {
      pendingFetches[userId] = true;
      setIsLoading(true);

      if (walletDataCache[userId]) {
        walletDataCache[userId].isLoading = true;
      }

      // Fetch user balance data from the new API route
      const balanceRes = await fetch(`/api/users/balance?userId=${userId}`);
      const balanceResult = await balanceRes.json();
      console.log('Fetched balance data:', balanceResult);

      if (!balanceRes.ok) {
        throw new Error(balanceResult.message || 'Failed to fetch balance data');
      }

      setUserData(balanceResult.user || null);

      // Update the cache
      walletDataCache[userId] = {
        userData: balanceResult.user || null,
        timestamp: Date.now(),
        isLoading: false,
      };

      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to fetch wallet data');
      if (userId && userId in walletDataCache) {
        walletDataCache[userId].isLoading = false;
      }
    } finally {
      setIsLoading(false);
      if (userId) {
        delete pendingFetches[userId];
      }
    }
  }, [userId]);

  // Memoize cache check logic
  const shouldFetchFromCache = useMemo(() => {
    if (skipCache || !userId) return false;

    const cachedData = walletDataCache[userId];
    const now = Date.now();

    return cachedData &&
      !cachedData.isLoading &&
      now - cachedData.timestamp < CACHE_DURATION;
  }, [userId, skipCache]);

  useEffect(() => {
    // Add this check at the very beginning
    if (skipCache) {
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setIsLoading(false);
      return;
    }

    if (shouldFetchFromCache) {
      const cachedData = walletDataCache[userId];
      setUserData(cachedData.userData);
      setIsLoading(false);
    } else {
      fetchData();
    }
  }, [userId, skipCache, fetchData, shouldFetchFromCache]);

  // Memoize the return object to prevent unnecessary re-renders
  const result = useMemo(() => ({
    currentUserData: userData || null,
    isLoading,
    error,
    refresh: fetchData,
  }), [userData, isLoading, error, fetchData]);

  console.log('useWalletData returning:', result);
  return result;
};