import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

const CACHE_DURATION = 5 * 60 * 1000;
const userDataCache = new Map<string, { data: any; timestamp: number }>();

export function useUserData({ skipCache = false }: { skipCache?: boolean } = {}) {
  const { data: session, status } = useSession();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any | null>(null);

  const userId = session?.user?.id;

  // 🔹 Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/users/user?id=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch user data');
      setUserData(result.user);
      userDataCache.set(userId, { data: result.user, timestamp: Date.now() });
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 🔹 Update user data
  const updateUser = useCallback(
    async (updates: Partial<any>) => {
      if (!userId) throw new Error("User ID not found");

      try {
        setIsLoading(true);
        const res = await fetch(`/api/users`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId, ...updates }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to update user profile");

        // ✅ Update local state & cache immediately
        const newUserData = { ...userData, ...updates };
        setUserData(newUserData);
        userDataCache.set(userId, { data: newUserData, timestamp: Date.now() });

        return result;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error("Failed to update user data"));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, userData]
  );

  // 🔹 Auto-fetch user data
  useEffect(() => {
    if (status === 'loading') {
      // Session is still being determined — stay in loading state
      return;
    }
    if (!userId) {
      // Session resolved but no user (unauthenticated)
      setIsLoading(false);
      return;
    }
    const cachedData = userDataCache.get(userId);
    const now = Date.now();
    if (!skipCache && cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
      setUserData(cachedData.data);
      setIsLoading(false);
    } else {
      fetchUserData();
    }
  }, [userId, status, skipCache, fetchUserData]);

  return {
    currentUserData: userData,
    isLoading: status === 'loading' || isLoading,
    error,
    refresh: fetchUserData,
    updateUser, // 🔹 New function
  };
}
