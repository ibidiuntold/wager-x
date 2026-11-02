import React, { createContext, useContext, useState } from 'react';
import { createRandomMatch, createGameSession, joinGameSession } from '@/services/gameSession';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useGameConfig } from '@/hooks/useGameConfig';
import { GameId } from '@/config/games';

interface MatchingContextType {
  startRandomMatch: (gameSlug: GameId, wager: number) => Promise<void>;
  inviteFriend: (gameSlug: GameId, wager: number) => Promise<string>;
  joinGame: (sessionId: string) => Promise<void>;
  isMatching: boolean;
  error: string | null;
}

const GameMatchingContext = createContext<MatchingContextType | null>(null);

export function GameMatchingProvider({ children }: { children: React.ReactNode }) {
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthSession();

  const startRandomMatch = async (gameSlug: GameId, wager: number) => {
    if (!user) {
      throw new Error('User must be logged in to start a match');
    }
    
    setIsMatching(true);
    setError(null);
    try {
      const { config } = useGameConfig(gameSlug);
      if (!config) {
        throw new Error('Game configuration not found');
      }

      await createRandomMatch(
        gameSlug,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '/images/avatars/default.png',
        wager,
        config
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start match');
      throw err;
    } finally {
      setIsMatching(false);
    }
  };

  const inviteFriend = async (gameSlug: GameId, wager: number) => {
    if (!user) {
      throw new Error('User must be logged in to create an invite');
    }

    setError(null);
    try {
      const { config } = useGameConfig(gameSlug);
      if (!config) {
        throw new Error('Game configuration not found');
      }

      const sessionId = await createGameSession(
        gameSlug,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '/images/avatars/default.png',
        wager,
        config,
        false // not a random match
      );
      
      return sessionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
      throw err;
    }
  };

  const joinGame = async (sessionId: string) => {
    if (!user) {
      throw new Error('User must be logged in to join a game');
    }

    setError(null);
    try {
      await joinGameSession(
        sessionId,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '/images/avatars/default.png'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      throw err;
    }
  };

  return (
    <GameMatchingContext.Provider value={{
      startRandomMatch,
      inviteFriend,
      joinGame,
      isMatching,
      error
    }}>
      {children}
    </GameMatchingContext.Provider>
  );
}

export const useGameMatching = () => {
  const context = useContext(GameMatchingContext);
  if (!context) {
    throw new Error('useGameMatching must be used within a GameMatchingProvider');
  }
  return context;
};
