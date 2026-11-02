'use client';

import { useEffect, useState } from 'react';

export function useBalances(userId: string) {
  const [balance, setBalance] = useState<{ amount: number; currency: string; lastUpdated: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/users/balance?userId=${userId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch balance');
      const data = result.user;
      setBalance({
        amount: (Number(data?.walletBalance) || 0) + (Number(data?.walletBonus) || 0),
        currency: 'NGN',
        lastUpdated: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  return { balance, loading, error, refresh: fetchBalance };
}
