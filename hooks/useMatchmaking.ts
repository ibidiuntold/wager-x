import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { GameSession, OpponentData } from '@/types/game.types';
import { db } from '@/lib/firebase';

interface UseMatchmakingProps {
  gameId: string;
  wager: number;
  sessionId?: string;
}

interface UseMatchmakingReturn {
  findingOpponent: boolean;
  opponent: OpponentData | null;
  error: Error | null;
  startMatchmaking: () => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
}

// Longer polling interval to reduce Firebase read operations
const POLLING_INTERVAL = 5000; // 5 seconds instead of 3 seconds

export const useMatchmaking = ({ gameId, wager, sessionId: initialSessionId }: UseMatchmakingProps): UseMatchmakingReturn => {
  const [findingOpponent, setFindingOpponent] = useState(false);
  const [opponent, setOpponent] = useState<OpponentData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  
  const { data: session } = useSession();
  const user = session?.user;
  
  // Use ref to track interval to prevent memory leaks
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track component mounted state to prevent state updates after unmounting
  const isMountedRef = useRef<boolean>(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Poll for opponent updates
  const pollForOpponent = useCallback(async (currentSessionId: string) => {
    if (!user?.id || !currentSessionId || !isMountedRef.current) return;

    try {
      const sessionRef = doc(db, 'gameSessions', currentSessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        if (isMountedRef.current) {
          setError(new Error('Session not found'));
          setFindingOpponent(false);
        }
        return;
      }
      
      const sessionData = { id: sessionSnap.id, ...sessionSnap.data() } as GameSession;
      
      // Check if session has expired
      if (sessionData.expiresAt < Date.now() && sessionData.status === 'waiting') {
        if (isMountedRef.current) {
          setError(new Error('Matchmaking timed out. Please try again.'));
          setFindingOpponent(false);
        }
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }
      
      // Check if an opponent has joined
      if (Object.keys(sessionData.players).length > 1) {
        const opponentId = Object.keys(sessionData.players).find(id => id !== user.id);
        
        if (opponentId && sessionData.players[opponentId]) {
          const opponentData = sessionData.players[opponentId];
          
          if (isMountedRef.current) {
            setOpponent({
              id: opponentId,
              name: opponentData.nickname,
              avatar: opponentData.avatarUrl,
              wager: sessionData.wager,
              isBot: opponentData.isBot
            });
            
            setFindingOpponent(false);
          }
          
          // Update session status if needed
          if (sessionData.status === 'waiting') {
            await updateDoc(sessionRef, {
              status: 'playing',
              lastActivityTime: Date.now()
            });
          }
        }
      }
    } catch (err) {
      console.error('Error polling for opponent:', err);
      if (isMountedRef.current) {
        setError(err as Error);
      }
    }
  }, [user]);

  // Start the matchmaking process
  const startMatchmaking = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    try {
      setFindingOpponent(true);
      setError(null);
      
      if (sessionId) {
        // Update existing session for matchmaking
        const sessionRef = doc(db, 'gameSessions', sessionId);
        await updateDoc(sessionRef, {
          isRandomMatch: true,
          lastActivityTime: Date.now()
        });

        setSessionId(sessionId);
      } else if (initialSessionId) {
        // Use initial session ID
        setSessionId(initialSessionId);
      } else {
        throw new Error('No session ID provided');
      }

      // Check for existing compatible sessions first
      const sessionsRef = collection(db, 'gameSessions');
      const matchQuery = query(
        sessionsRef,
        where('gameId', '==', gameId),
        where('status', '==', 'waiting'),
        where('wager', '==', wager),
        where('isRandomMatch', '==', true)
      );
      
      const querySnapshot = await getDocs(matchQuery);
      
      // Check if we can join an existing session
      if (!querySnapshot.empty) {
        for (const docSnapshot of querySnapshot.docs) {
          const sessionData = docSnapshot.data() as Omit<GameSession, 'id'>;
          
          // Skip our own sessions
          if (Object.keys(sessionData.players).includes(user.id)) {
            continue;
          }

          // Check if session is not expired
          if (sessionData.expiresAt > Date.now()) {
            // Join this session
            const sessionId = docSnapshot.id;
            const sessionRef = doc(db, 'gameSessions', sessionId);

            await updateDoc(sessionRef, {
              [`players.${user.id}`]: {
                id: user.id,
                nickname: user.name || `Player-${user.id.substring(0, 6)}`,
                avatarUrl: user.image || '/images/avatars/default.png',
                isBot: false,
                status: 'active'
              },
              status: 'playing',
              lastActivityTime: Date.now()
            });
            
            // Find opponent
            const opponentId = Object.keys(sessionData.players)[0];
            setOpponent({
              id: opponentId,
              name: sessionData.players[opponentId].nickname,
              avatar: sessionData.players[opponentId].avatarUrl,
              wager: sessionData.wager,
              isBot: sessionData.players[opponentId].isBot
            });
            
            setFindingOpponent(false);
            return;
          }
        }
      }
      
      // Start polling for opponent
      const currentSessionId = sessionId || initialSessionId;
      if (currentSessionId) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        // Do an initial poll immediately
        await pollForOpponent(currentSessionId);
        
        // Then set up interval if still finding opponent
        if (isMountedRef.current && findingOpponent) {
          pollingIntervalRef.current = setInterval(() => {
            pollForOpponent(currentSessionId);
          }, POLLING_INTERVAL);
        }
      }
    } catch (err) {
      console.error('Error in matchmaking:', err);
      if (isMountedRef.current) {
        setError(err as Error);
        setFindingOpponent(false);
      }
    }
  }, [gameId, initialSessionId, pollForOpponent, sessionId, user, wager, findingOpponent]);

  // Cancel the matchmaking process
  const cancelMatchmaking = useCallback(async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (sessionId && isMountedRef.current) {
      try {
        const sessionRef = doc(db, 'gameSessions', sessionId);
        await updateDoc(sessionRef, {
          isRandomMatch: false
        });
      } catch (err) {
        console.error('Error canceling matchmaking:', err);
      }
    }

    if (isMountedRef.current) {
      setFindingOpponent(false);
    }
  }, [sessionId]);

  return {
    findingOpponent,
    opponent,
    error,
    startMatchmaking,
    cancelMatchmaking
  };
};