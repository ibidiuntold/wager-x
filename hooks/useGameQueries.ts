'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useCollectionRefs } from './useFirestore';
import { query, where, orderBy, limit, getDocs, QueryConstraint } from 'firebase/firestore';
import type { Game } from '@/types/game.types';

type GameQueryType = 'all' | 'top' | 'new' | 'featured' | 'by-keyword';

interface UseGameQueriesProps {
  type: GameQueryType;
  limit?: number;
  keyword?: string;
  autoLoad?: boolean;
}

interface UseGameQueriesResult {
  games: Game[] | null;
  error: Error | null;
  status: 'loading' | 'success' | 'error';
  refetch: () => Promise<void>;
}

export const useGameQueries = ({
  type,
  limit: queryLimit = 10,
  keyword,
  autoLoad = true
}: UseGameQueriesProps): UseGameQueriesResult => {
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { gamesRef } = useCollectionRefs();
  const firestore = useFirestore();

  const fetchGames = useCallback(async () => {
    try {
      setStatus('loading');
      
      const constraints: QueryConstraint[] = [
        // Only show active games
        where('activeStatus', '==', true)
      ];
      
      switch (type) {
        case 'top':
          constraints.push(orderBy('monthPlayers', 'desc'));
          break;
        case 'new':
          // For new games, check if they have the 'new' keyword first, or fall back to createdAt
          try {
            const newGamesQuery = query(
              gamesRef(),
              where('activeStatus', '==', true),
              where('keywords', 'array-contains', 'new'),
              limit(queryLimit)
            );
            const newGamesSnapshot = await getDocs(newGamesQuery);
            
            if (!newGamesSnapshot.empty) {
              const gamesData = newGamesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  ...data,
                  id: doc.id
                } as Game;
              });
              
              setGames(gamesData);
              setStatus('success');
              return;
            }
            
            // Fall back to createdAt if no games with 'new' keyword
            constraints.push(orderBy('createdAt', 'desc'));
          } catch (err) {
            // If the query fails, fall back to createdAt
            console.error('Error fetching new games by keyword:', err);
            constraints.push(orderBy('createdAt', 'desc'));
          }
          break;
        case 'featured':
          constraints.push(where('featured', '==', true));
          break;
        case 'by-keyword':
          if (keyword) {
            constraints.push(where('keywords', 'array-contains', keyword.toLowerCase()));
          }
          break;
        default:
          break;
      }
      
      constraints.push(limit(queryLimit));
      
      const gamesQuery = query(gamesRef(), ...constraints);
      const snapshot = await getDocs(gamesQuery);
      
      const gamesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        } as Game;
      });
      
      setGames(gamesData);
      setStatus('success');
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setStatus('error');
    }
  }, [firestore, gamesRef, type, queryLimit, keyword]);

  useEffect(() => {
    if (autoLoad) {
      fetchGames();
    }
  }, [autoLoad, fetchGames]);

  return {
    games,
    error,
    status,
    refetch: fetchGames
  };
};