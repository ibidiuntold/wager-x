import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export const useGameSession = (sessionId: string | null) => {
  const { data: session } = useSession();
  const [gameSession, setGameSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setGameSession(null);
      setLoading(false);
      return;
    }
      setLoading(true);
    try {
      const res = await fetch(`/api/game-sessions?id=${encodeURIComponent(sessionId)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch game session');
      setGameSession(result.session);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch game session'));
      setGameSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Example: update game state
  const updateGameState = async (state: Record<string, any>) => {
    if (!sessionId) return false;
    try {
      const res = await fetch('/api/game-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, ...state }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update game state');
      fetchSession();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update game state'));
      return false;
    }
  };

  // Add other session operations as needed, using /api/game-sessions

  return {
    session: gameSession,
    loading,
    error,
    updateGameState,
    refresh: fetchSession,
  };
};