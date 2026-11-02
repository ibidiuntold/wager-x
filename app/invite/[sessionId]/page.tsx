'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import BackdropPanel from '@/components/games/ui/BackdropPanel';
import AuthModal from '@/components/auth/AuthModal';
import { useWalletOperations } from '@/hooks/useWalletOperations';
import { Console } from 'console';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: sessionData, status: userStatus } = useSession();
  const user = sessionData?.user;
  const sessionId = params.sessionId as string;
  const { debitWager } = useWalletOperations();

  const [loading, setLoading] = useState(true);
  const [sessionDataState, setSessionDataState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Function to check session and handle auth redirection
  const checkSessionAndAuth = async () => {
    try {
      setLoading(true);
      // TODO: Replace with API call to fetch session data
      // Example: const res = await fetch(`/api/game-session/${sessionId}`);
      // const data = await res.json();
      // setSessionDataState(data.session);
      // For now, set loading to false
      setLoading(false);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load game invitation');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userStatus === 'error' || (userStatus === 'authenticated' && !user)) {
      setShowAuthModal(true);
    } else if (userStatus === 'authenticated' && user) {
      checkSessionAndAuth();
    }
  }, [sessionId, userStatus, user]);

  const handleAcceptInvite = async () => {
    if (!user || !sessionDataState) return;
    try {
      setJoining(true);
      // TODO: Replace with API call to accept invite and process wager
      // await debitWager(sessionDataState.wager, sessionId, sessionDataState.gameId);
      toast({
        title: 'Invitation Accepted',
        description: 'Joining game session...',
      });
      // Redirect to game page
      const gameUrl = `/game/${sessionDataState.config.slug}?session=${sessionId}`;
      window.location.href = gameUrl;
    } catch (err) {
      console.error('Error accepting invite:', err);
      toast({
        title: 'Failed to Join',
        description: err instanceof Error ? err.message : 'There was a problem joining the game. Please try again.',
        variant: 'destructive',
      });
      setJoining(false);
    }
  };

  const handleAuthSuccess = () => {
    window.location.reload();
  };

  const handleDeclineInvite = () => {
    router.push('/games');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[70vh] p-4"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <BackdropPanel className="max-w-md w-full p-6 space-y-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-white">Invitation Error</h2>
          <div className="text-red-300 text-center mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 
                      hover:from-purple-700 hover:to-blue-600 text-white font-semibold 
                      rounded-lg shadow-md transition-all transform hover:scale-[1.02]"
          >
            Browse Games
          </button>
        </BackdropPanel>
      </motion.div>
    );
  }

  if (showAuthModal) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (!sessionDataState) return null;

  const inviter = Object.values(sessionDataState.players)[0] as any;
  const wagerAmount = sessionDataState.wager;
  const gameTitle = sessionDataState.config?.title || 'Game';

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[70vh] p-4"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      <BackdropPanel className="max-w-md w-full p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-slate-700 dark:text-white">
          Game Invitation
        </h2>
        <div className="flex flex-col items-center space-y-6">
          {/* Game info */}
          <div className="w-full text-center">
            <h3 className="text-xl text-slate-700 dark:text-white mb-2">{gameTitle}</h3>
            <div className="text-slate-700 dark:text-white/80 mb-4">{sessionDataState.config?.description}</div>
            <div className="flex items-center justify-center mb-6">
              <img
                src={sessionDataState.config?.image || '/images/game-placeholder.png'}
                alt={gameTitle}
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>
          </div>
          {/* Inviter info */}
          <div className="flex items-center space-x-4 bg-slate-100/20 dark:bg-black/20 p-4 rounded-lg w-full">
            <img
              src={inviter?.avatarUrl || '/images/avatars/default.png'}
              alt={inviter?.nickname || 'Player'}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="text-slate-700 dark:text-white font-medium">{inviter?.nickname || 'Player'}</div>
              <div className="text-slate-700 dark:text-white/70 text-sm">invites you to play</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-slate-700 dark:text-white font-bold">₦{wagerAmount.toLocaleString()}</div>
              <div className="text-slate-700 dark:text-white/70 text-xs">wager amount</div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex space-x-4 w-full pt-4">
            <button
              onClick={handleDeclineInvite}
              disabled={joining}
              className="flex-1 py-3 bg-slate-800/10 hover:bg-slate-800/20  dark:bg-white/10 dark:hover:bg-white/20 
                        text-slate-700 dark:text-white font-medium rounded-lg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptInvite}
              disabled={joining}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-500 
                        hover:from-purple-700 hover:to-blue-600 text-white font-semibold 
                        rounded-lg shadow-md transition-all transform hover:scale-[1.02]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {joining ? (
                <>
                  <span className="inline-block mr-2 animate-spin">⟳</span>
                  Joining...
                </>
              ) : 'Accept'}
            </button>
          </div>
        </div>
      </BackdropPanel>
    </motion.div>
  );
}