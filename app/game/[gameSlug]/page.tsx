'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Settings, QrCode } from 'lucide-react';

// Components
import WagerForm from '@/components/games/common/WagerForm';
import InviteDrawer from '@/components/games/common/InviteDrawer';
import SessionInfoPanel from '@/components/games/common/SessionInfoPanel';
import GameSettings from '@/components/games/common/GameSettings';
import QRCodeDialog from '@/components/games/common/QRCodeDialog';
import GameStateContainer from '@/components/games/ui/GameStateContainer';
import UserInfo from '@/components/games/common/UserInfo';
import WinNotification from '@/components/games/common/WinNotification';

// Hooks
import { useGameSession } from '@/hooks/useGameSession';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useWalletOperations } from '@/hooks/useWalletOperations';
import { useSessionStateMachine, SessionState } from '@/hooks/useSessionStateMachine';
import { isSessionValid } from '@/lib/utils';

// Types
import { GameConfig, OpponentData } from '@/types/game.types';

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const gameSlug = params.gameSlug as string;
  const initialSessionIdParam = searchParams.get('session') || undefined;

  // Validate and store session ID
  const [validatedSessionId, setValidatedSessionId] = useState<string | undefined>(undefined);
  const [sessionValidationInProgress, setSessionValidationInProgress] = useState(false);

  // States
  const [game, setGame] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [wager, setWager] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showWinNotification, setShowWinNotification] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'forfeit' | 'opponentForfeit'>('win');
  const [lastProcessedUpdate, setLastProcessedUpdate] = useState<number>(0);

  // State machine for game session
  const {
    state: uiState,
    context,
    send,
    updateContext,
    syncWithFirebaseSession
  } = useSessionStateMachine({
    onStateChange: (newState, prevState) => {
      console.log(`Game state transition: ${prevState} -> ${newState}`);
    }
  });

  // Validate session ID (replace Firestore with API call or stub)
  useEffect(() => {
    const validateSession = async () => {
      if (!initialSessionIdParam || sessionValidationInProgress) return;

      setSessionValidationInProgress(true);
      try {
        // TODO: Replace with API call to validate session
        const isValid = await isSessionValid(undefined, initialSessionIdParam);

        if (isValid) {
          setValidatedSessionId(initialSessionIdParam);
        }
        else {
          toast({
            title: 'Session Error',
            description: 'The game session has expired or is no longer available',
            variant: 'destructive',
          });
          router.replace(`/game/${gameSlug}`);
          send({ type: 'RESET' });
        }
      } catch (error) {
        console.error('Session validation error:', error);
        router.replace(`/game/${gameSlug}`);
      } finally {
        setSessionValidationInProgress(false);
      }
    };
    validateSession();
  }, [initialSessionIdParam, router, gameSlug, sessionValidationInProgress, send, toast]);

  // Session management
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    createSession,
    joinSession,
    leaveSession,
    cancelSession,
    opponent,
    sessionStatus
  } = useGameSession({
    gameId: game?.id,
    sessionId: validatedSessionId
  });

  // Matchmaking
  const {
    findingOpponent,
    error: matchmakingError,
    startMatchmaking,
    cancelMatchmaking,
  } = useMatchmaking({
    gameId: game?.id || '',
    wager,
    sessionId: session?.id
  });

  // Sync session data with state machine
  useEffect(() => {
    if (session) {
      syncWithFirebaseSession(session);
      updateContext({
        session,
        wager: session.wager
      });
    }
  }, [session, syncWithFirebaseSession, updateContext]);

  // Fetch game data (replace Firestore with API call or stub)
  useEffect(() => {
    const fetchGame = async () => {
      try {
        // TODO: Replace with API call to fetch game by slug
        // Example: const res = await fetch(`/api/games?slug=${gameSlug}`);
        // const data = await res.json();
        // setGame(data.game);
        // setWager(data.game.minWager);
        // updateContext({ wager: data.game.minWager });
        // For now, set loading to false
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
        toast({
          title: 'Error',
          description: 'Failed to load game data. Please try again.',
          variant: 'destructive',
        });
        send({
          type: 'ERROR',
          message: 'Failed to load game data'
        });
      } finally {
        setLoading(false);
      }
    };
    if (gameSlug) {
      fetchGame();
    }
  }, [gameSlug, toast, session, validatedSessionId, send, updateContext]);

  // Watch for session changes and handle notifications
  useEffect(() => {
    if (!session || !session.lastUpdateTimestamp || session.lastUpdateTimestamp <= lastProcessedUpdate) {
      return;
    }
    setLastProcessedUpdate(session.lastUpdateTimestamp);
    if (session.status === 'finished' && session.forfeitedBy) {
      const isForfeiter = session.forfeitedBy === user?.id;
      setGameResult(isForfeiter ? 'forfeit' : 'opponentForfeit');
      setShowWinNotification(true);
      return;
    }
    if (session.status === 'finished' && session.winner) {
      setGameResult(session.winner === user?.id ? 'win' : 'lose');
      setShowWinNotification(true);
    }
  }, [session, lastProcessedUpdate, user?.id]);

  // Show errors from session hook
  useEffect(() => {
    if (sessionError) {
      toast({
        title: 'Session Error',
        description: sessionError.message,
        variant: 'destructive',
      });
      send({
        type: 'ERROR',
        message: sessionError.message
      });
    }
  }, [sessionError, toast, send]);

  // Show errors from matchmaking hook
  useEffect(() => {
    if (matchmakingError) {
      toast({
        title: 'Matchmaking Error',
        description: matchmakingError.message,
        variant: 'destructive',
      });
      send({
        type: 'ERROR',
        message: matchmakingError.message
      });
    }
  }, [matchmakingError, toast, send]);

  // Handle wager selection
  const handleWagerChange = (amount: number) => {
    setWager(amount);
    updateContext({ wager: amount });
  };

  // Handle continue to invite
  const handleContinueToInvite = async () => {
    if (!game) return;
    send({ type: 'SUBMIT_WAGER' });
    try {
      const sessionId = await createSession(game, wager);
      if (!sessionId) {
        throw new Error('Failed to create session');
      }
      setValidatedSessionId(sessionId);
      send({ type: 'SESSION_CREATED' });
      toast({
        title: 'Session Created',
        description: 'You can now invite friends to play.',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Session Creation Failed',
        description: error instanceof Error ? error.message : 'Unable to create game session. Please try again.',
        variant: 'destructive',
      });
      send({
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Failed to create session'
      });
    }
  };

  // Handle invite with ID (replace Firestore with API call or stub)
  const handleInviteWithId = async (friendId: string, opponentData: OpponentData) => {
    if (!session) return;
    try {
      // TODO: Replace with API call to update session invite
      toast({
        title: 'Invite Sent',
        description: `Invite sent to friend with ID: ${friendId}`,
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Invite Failed',
        description: 'Failed to send invite. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel invitation
  const handleCancelInvite = async () => {
    try {
      if (findingOpponent) {
        await cancelMatchmaking();
      }
      const success = await cancelSession();
      if (success) {
        toast({
          title: 'Invitation Cancelled',
          description: 'Your game invitation has been cancelled.',
        });
        setValidatedSessionId(undefined);
        send({ type: 'RESET' });
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle random match
  const handleStartRandom = async () => {
    if (!session) return;
    try {
      send({ type: 'FIND_RANDOM_OPPONENT' });
      await startMatchmaking();
      toast({
        title: 'Finding Opponent',
        description: 'Looking for a random opponent...',
      });
    } catch (error) {
      console.error('Error starting random match:', error);
      toast({
        title: 'Matchmaking Failed',
        description: 'Failed to start random matchmaking. Please try again.',
        variant: 'destructive',
      });
      send({
        type: 'ERROR',
        message: 'Failed to start matchmaking'
      });
    }
  };

  // Handle settings change
  const handleSettingsChange = (settings: any) => {
    console.log('Settings changed:', settings);
    // Implement settings change logic
  };

  // Handle session exit
  const handleExitSession = async () => {
    try {
      if (findingOpponent) {
        await cancelMatchmaking();
      }
      if (session) {
        await leaveSession();
      }
      toast({
        title: 'Session Ended',
        description: 'You have left the game session.',
      });
      setValidatedSessionId(undefined);
      send({ type: 'RESET' });
    } catch (error) {
      console.error('Error exiting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to exit session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    setShowWinNotification(false);
    setValidatedSessionId(undefined);
    send({ type: 'RESET' });
    router.push(`/game/${gameSlug}`);
  };

  // Handle browse games
  const handleBrowseGames = () => {
    setShowWinNotification(false);
    router.push('/');
  };

  // Get content based on current UI state
  const renderGameContent = () => {
    // If validating session ID
    if (sessionValidationInProgress) {
      return (
        <GameStateContainer
          isActive={true}
          state="validating"
          isLoading={true}
          title="Validating Game Session"
        >
          <div className="flex flex-col items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            <div className="mt-4 text-white/70">Validating game session...</div>
          </div>
        </GameStateContainer>
      );
    }

    // Render wager form
    if (uiState === 'setting_wager' || uiState === 'creating_session') {
      return (
        <GameStateContainer
          isActive={true}
          state={uiState}
          isLoading={uiState === 'creating_session' || loading}
          title={`${game?.title}: Set Your Wager`}
        >
          <WagerForm
            minWager={game?.minWager || 100}
            maxWager={game?.maxWager || 10000}
            wager={wager}
            onWagerChange={handleWagerChange}
            loading={loading}
            className="mx-auto"
            animate={false}
          />
          <button
            onClick={handleContinueToInvite}
            disabled={uiState === 'creating_session'}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 
              text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]
              flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {uiState === 'creating_session' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Placing Wager...
              </>
            ) : (
              'Place Wager'
            )}
          </button>
        </GameStateContainer>
      );
    }

    // Render invite drawer
    if (uiState === 'waiting_for_opponent') {
      return (
        <GameStateContainer
          isActive={true}
          state={uiState}
          isLoading={loading}
          title="Invite a Friend to Play"
        >
          <InviteDrawer
            isOpen={true}
            onClose={handleCancelInvite}
            gameSlug={gameSlug}
            gameName={game?.title || ''}
            wagerAmount={wager}
            sessionId={session?.id}
            onInviteWithId={handleInviteWithId}
            onStartRandom={handleStartRandom}
            className="w-full"
          />
        </GameStateContainer>
      );
    }

    // Finding random opponent
    if (uiState === 'finding_random_opponent' || findingOpponent) {
      return (
        <GameStateContainer
          isActive={true}
          state="finding_random_opponent"
          title="Finding an Opponent"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 animate-pulse flex items-center justify-center">
              <span className="text-white text-3xl">🎮</span>
            </div>
            <p className="text-white/80 text-center">
              Looking for a random opponent. This might take a moment...
            </p>
            <button
              onClick={handleCancelInvite}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 
                      rounded-full transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </GameStateContainer>
      );
    }

    // Game initializing
    if (uiState === 'opponent_joined' || uiState === 'initializing_game') {
      return (
        <GameStateContainer
          isActive={true}
          state={uiState}
          title="Initializing Game"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 animate-pulse flex items-center justify-center">
              <span className="text-white text-3xl">⚙️</span>
            </div>
            <p className="text-white/80 text-center">
              Setting up the game session. This will only take a moment...
            </p>
          </div>
        </GameStateContainer>
      );
    }

    // Active gameplay
    if (uiState === 'playing') {
      return (
        <motion.div
          className="flex flex-col w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          key="active-game"
        >
          <div className="flex flex-col md:flex-row h-full relative">
            {/* Game container */}
            <div className="flex-grow bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden">
              {session && (
                <iframe
                  src={`/game-assets/template/game.html?sessionId=${session.id}&playerId=${user?.id}`}
                  className="w-full h-full border-0"
                  title={game?.title}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                />
              )}
            </div>

            {/* Controls sidebar */}
            <div className="w-full md:w-72 space-y-4 mt-4 md:mt-0 md:ml-4">
              {session && (
                <SessionInfoPanel
                  session={session}
                  onExit={handleExitSession}
                />
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Game finished
    if (uiState === 'game_finished') {
      return (
        <GameStateContainer
          isActive={!showWinNotification} // Hide when the win notification is shown
          state={uiState}
          title="Game Finished"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-white text-3xl">🏆</span>
            </div>
            <p className="text-white/80 text-center">
              The game has ended. Check the results!
            </p>
            <div className="flex space-x-4 w-full">
              <button
                onClick={handleBrowseGames}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 
                        text-white font-medium rounded-lg transition-colors"
              >
                Browse Games
              </button>
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-500 
                        hover:from-purple-700 hover:to-blue-600 text-white font-semibold 
                        rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </GameStateContainer>
      );
    }

    // Session expired
    if (uiState === 'session_expired') {
      return (
        <GameStateContainer
          isActive={true}
          state={uiState}
          title="Session Expired"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gray-600/50 flex items-center justify-center">
              <span className="text-white text-3xl">⏱️</span>
            </div>
            <p className="text-white/80 text-center">
              This game session has expired or was cancelled.
            </p>
            <button
              onClick={() => {
                setValidatedSessionId(undefined);
                send({ type: 'RESET' });
                router.replace(`/game/${gameSlug}`);
              }}
              className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 
                      rounded-full transition-colors text-sm"
            >
              Start New Game
            </button>
          </div>
        </GameStateContainer>
      );
    }

    // Error state
    if (uiState === 'error') {
      return (
        <GameStateContainer
          isActive={true}
          state={uiState}
          title="Something Went Wrong"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-white text-3xl">⚠️</span>
            </div>
            <p className="text-white/80 text-center">
              {context.error || 'An error occurred during the game session.'}
            </p>
            <button
              onClick={() => {
                setValidatedSessionId(undefined);
                send({ type: 'RESET' });
                router.replace(`/game/${gameSlug}`);
              }}
              className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 
                      rounded-full transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </GameStateContainer>
      );
    }

    // Default/loading state
    return (
      <GameStateContainer
        isActive={true}
        state={uiState}
        isLoading={true}
        title={game?.title || 'Loading Game'}
      >
        <div className="flex flex-col items-center justify-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      </GameStateContainer>
    );
  };

  if (loading && !game) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!game && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold text-white mb-4">Game Not Found</h2>
        <p className="text-white/70 mb-6">The game you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg"
        >
          Browse Games
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[80vw] h-[70vh] mx-auto relative">
      {/* Header with user info and controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-4">
        <UserInfo />
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-slate-800/10 dark:bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Game Settings"
          >
            <Settings className="w-5 h-5 text-slate-800 dark:text-white" />
          </button>
          <button
            onClick={() => setShowQRCode(true)}
            className="p-2 bg-slate-800/10 dark:bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="QR Code"
          >
            <QrCode className="w-5 h-5 text-slate-800 dark:text-white" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {renderGameContent()}
        </AnimatePresence>
      </div>
      {/* Game Settings Modal */}
      <GameSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialSettings={{
          sound: {
            enabled: true,
            volume: 0.8,
            effects: true,
            music: true
          }
        }}
        onSettingsChange={handleSettingsChange}
      />
      {/* QR Code Modal */}
      <QRCodeDialog
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        url={session ? `${window.location.origin}/game/${gameSlug}?session=${session.id}` : ''}
        gameTitle={game?.title}
      />
      {/* Win/Lose Notification */}
      <WinNotification
        isOpen={showWinNotification}
        onClose={() => setShowWinNotification(false)}
        result={gameResult}
        amount={session?.wager ? session.wager * 2 : 0}
        opponentName={opponent?.name}
        onPlayAgain={handlePlayAgain}
        onBrowseGames={handleBrowseGames}
      />
    </div>
  );
}