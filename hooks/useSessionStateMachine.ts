import { useState, useEffect, useCallback, useRef } from 'react';
import { GameSession } from '@/types/game.types';

// Define the possible states for the game session
export type SessionState = 
  | 'idle' 
  | 'setting_wager'
  | 'creating_session'
  | 'waiting_for_opponent'
  | 'finding_random_opponent'
  | 'opponent_joined'
  | 'initializing_game'
  | 'playing'
  | 'game_finished'
  | 'session_expired'
  | 'error';

// Define the possible events that can trigger state transitions
export type SessionEvent =
  | { type: 'SET_WAGER' }
  | { type: 'SUBMIT_WAGER' }
  | { type: 'SESSION_CREATED' }
  | { type: 'FIND_RANDOM_OPPONENT' }
  | { type: 'OPPONENT_JOINED' }
  | { type: 'GAME_READY' }
  | { type: 'GAME_STARTED' }
  | { type: 'GAME_FINISHED'; winner: string | null }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

// Define the context data that's shared across states
export interface SessionContext {
  session: GameSession | null;
  error: string | null;
  winner: string | null;
  wager: number;
  lastUpdateTimestamp?: number;
}

interface UseSessionStateMachineProps {
  initialState?: SessionState;
  initialContext?: Partial<SessionContext>;
  onStateChange?: (state: SessionState, prevState: SessionState) => void;
}

export function useSessionStateMachine({
  initialState = 'idle',
  initialContext = {},
  onStateChange
}: UseSessionStateMachineProps = {}) {
  const [state, setState] = useState<SessionState>(initialState);
  const [context, setContext] = useState<SessionContext>({
    session: null,
    error: null,
    winner: null,
    wager: 0,
    ...initialContext
  });

  // Use refs to track previous values to prevent unnecessary updates
  const prevSessionRef = useRef<GameSession | null>(null);
  const prevStateRef = useRef<SessionState>(initialState);
  const processingEventRef = useRef<boolean>(false);
  const pendingStateChangeRef = useRef<SessionState | null>(null);

  // Update the context without changing the state
  const updateContext = useCallback((newContext: Partial<SessionContext>) => {
    setContext(prev => {
      // Prevent unnecessary updates
      if (Object.keys(newContext).every(key => {
        const typedKey = key as keyof SessionContext;
        // Skip session deep comparison - we'll handle that separately
        if (typedKey === 'session') return true;
        return prev[typedKey] === newContext[typedKey];
      })) {
        return prev;
      }
      
      return { ...prev, ...newContext };
    });
  }, []);

  // Clean up Session object before storing it to avoid over-rendering
  const cleanSessionForContext = useCallback((session: GameSession | null): GameSession | null => {
    if (!session) return null;
    
    // Only keep essential session data for state machine
    return {
      id: session.id,
      status: session.status,
      players: session.players,
      wager: session.wager,
      winner: session.winner,
      initiator: session.initiator,
      lastUpdateTimestamp: session.lastUpdateTimestamp,
      config: {
        id: session.config.id,
        slug: session.config.slug,
        title: session.config.title
      }
    } as GameSession;
  }, []);

  // Send an event to the state machine
  const send = useCallback((event: SessionEvent) => {
    // Prevent sending new events while processing
    if (processingEventRef.current) {
      console.log('Event ignored during processing:', event.type);
      return;
    }
    
    processingEventRef.current = true;
    
    setState(currentState => {
      const prevState = currentState;
      let nextState = currentState;
      let contextUpdates: Partial<SessionContext> = {};

      // State transition logic
      switch (currentState) {
        case 'idle':
          if (event.type === 'SET_WAGER') {
            nextState = 'setting_wager';
          }
          break;

        case 'setting_wager':
          if (event.type === 'SUBMIT_WAGER') {
            nextState = 'creating_session';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'creating_session':
          if (event.type === 'SESSION_CREATED') {
            nextState = 'waiting_for_opponent';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'waiting_for_opponent':
          if (event.type === 'FIND_RANDOM_OPPONENT') {
            nextState = 'finding_random_opponent';
          } else if (event.type === 'OPPONENT_JOINED') {
            nextState = 'opponent_joined';
          } else if (event.type === 'SESSION_EXPIRED') {
            nextState = 'session_expired';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'finding_random_opponent':
          if (event.type === 'OPPONENT_JOINED') {
            nextState = 'opponent_joined';
          } else if (event.type === 'SESSION_EXPIRED') {
            nextState = 'session_expired';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'opponent_joined':
          if (event.type === 'GAME_READY') {
            nextState = 'initializing_game';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'initializing_game':
          if (event.type === 'GAME_STARTED') {
            nextState = 'playing';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'playing':
          if (event.type === 'GAME_FINISHED') {
            nextState = 'game_finished';
            contextUpdates = { winner: event.winner };
          } else if (event.type === 'SESSION_EXPIRED') {
            nextState = 'session_expired';
          } else if (event.type === 'ERROR') {
            nextState = 'error';
            contextUpdates = { error: event.message };
          }
          break;

        case 'game_finished':
        case 'session_expired':
        case 'error':
          if (event.type === 'RESET') {
            nextState = 'idle';
            contextUpdates = { 
              session: null, 
              error: null, 
              winner: null 
            };
          }
          break;
      }

      // Save the pending state change
      if (nextState !== prevState) {
        pendingStateChangeRef.current = nextState;
      }

      // Apply context updates if any
      if (Object.keys(contextUpdates).length > 0) {
        setContext(prev => ({ ...prev, ...contextUpdates }));
      }

      return nextState;
    });
    
    processingEventRef.current = false;
  }, []);

  // Handle state changes and call onStateChange
  useEffect(() => {
    const currentState = state;
    const prevState = prevStateRef.current;
    
    if (currentState !== prevState) {
      prevStateRef.current = currentState;
      
      // Call onStateChange if defined
      if (onStateChange) {
        onStateChange(currentState, prevState);
      }
      
      console.log(`State transition: ${prevState} -> ${currentState}`);
    }
  }, [state, onStateChange]);

  // Map Firebase session status to our state machine states
  const syncWithFirebaseSession = useCallback((session: GameSession | null) => {
    // Prevent recursive calls if processing an event
    if (processingEventRef.current) {
      return;
    }
    
    // Early return if session is null and we're already in idle state
    if (!session && state === 'idle') {
      return;
    }
    
    // Avoid unnecessary updates by checking if session has changed
    const prevSession = prevSessionRef.current;
    const hasSessionChanged = session?.lastUpdateTimestamp !== prevSession?.lastUpdateTimestamp;
    
    if (!hasSessionChanged && session && prevSession) {
      // If timestamps are the same, do a quick check on critical fields
      const criticalFieldsMatch = 
        session.status === prevSession.status &&
        session.winner === prevSession.winner;
        
      if (criticalFieldsMatch) {
        return;
      }
    }
    
    // Update the session reference
    prevSessionRef.current = session;
    
    // Update session in context (with clean object to prevent deep renders)
    const cleanedSession = cleanSessionForContext(session);
    updateContext({ 
      session: cleanedSession,
      lastUpdateTimestamp: session?.lastUpdateTimestamp
    });

    // Don't send any events if we don't have a session and we're not in idle state
    if (!session) {
      send({ type: 'RESET' });
      return;
    }

    // Skip state syncing if a pending state change is in progress
    if (pendingStateChangeRef.current) {
      pendingStateChangeRef.current = null;
      return;
    }

    // Map Firebase session status to our state machine
    switch (session.status) {
      case 'waiting':
        // If status is already waiting or finding random opponent, don't change it
        if (state !== 'waiting_for_opponent' && state !== 'finding_random_opponent') {
          send({ type: 'SESSION_CREATED' });
        }
        break;
      
      case 'playing':
        // If we were waiting for an opponent
        if (state === 'waiting_for_opponent' || state === 'finding_random_opponent') {
          send({ type: 'OPPONENT_JOINED' });
          
          // Use timeouts to avoid state update loops
          setTimeout(() => {
            if (state !== 'playing') {
              send({ type: 'GAME_READY' });
            }
          }, 300);
          
          setTimeout(() => {
            if (state !== 'playing') {
              send({ type: 'GAME_STARTED' });
            }
          }, 600);
        } 
        // If we've just loaded a playing session
        else if (state === 'idle') {
          send({ type: 'SET_WAGER' });
          send({ type: 'SUBMIT_WAGER' });
          send({ type: 'SESSION_CREATED' });
          send({ type: 'OPPONENT_JOINED' });
          send({ type: 'GAME_READY' });
          send({ type: 'GAME_STARTED' });
        }
        break;
      
      case 'finished':
        if (state !== 'game_finished') {
          send({ 
            type: 'GAME_FINISHED', 
            winner: session.winner 
          });
        }
        break;
      
      case 'expired':
        if (state !== 'session_expired') {
          send({ type: 'SESSION_EXPIRED' });
        }
        break;
    }
  }, [state, updateContext, send, cleanSessionForContext]);

  return {
    state,
    context,
    send,
    updateContext,
    syncWithFirebaseSession
  };
}

// Helper function to map between Firebase session status and our state machine states
export function mapSessionStatusToState(
  status: string | undefined, 
  currentState: SessionState
): SessionState {
  if (!status) return 'idle';
  
  switch (status) {
    case 'waiting': return 'waiting_for_opponent';
    case 'playing': return 'playing';
    case 'finished': return 'game_finished';
    case 'expired': return 'session_expired';
    default: return currentState;
  }
}

// Helper function to get a user-friendly description of the current state
export function getSessionStateDescription(state: SessionState): string {
  switch (state) {
    case 'idle': return 'Ready to start';
    case 'setting_wager': return 'Setting your wager';
    case 'creating_session': return 'Creating game session';
    case 'waiting_for_opponent': return 'Waiting for an opponent';
    case 'finding_random_opponent': return 'Finding a random opponent';
    case 'opponent_joined': return 'Opponent joined';
    case 'initializing_game': return 'Initializing game';
    case 'playing': return 'Game in progress';
    case 'game_finished': return 'Game finished';
    case 'session_expired': return 'Session expired';
    case 'error': return 'Error occurred';
    default: return 'Unknown state';
  }
}