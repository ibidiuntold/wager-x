import { useState, useCallback } from 'react';

export const useNewsletter = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscribers');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch subscribers');
      setSubscribers(result.subscribers);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscribers'));
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to subscribe');
      fetchSubscribers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to subscribe'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add other newsletter operations as needed, using /api/subscribers

  return {
    subscribers,
    loading,
    error,
    fetchSubscribers,
    subscribe,
  };
};