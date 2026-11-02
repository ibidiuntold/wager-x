'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wallet, Clock, User, Award, X } from 'lucide-react';
import { SessionState, NetworkStatus, SessionPlayer } from '@/types/session.types';
import { GameSession } from '@/types/game.types';
import { cn } from "@/lib/utils";
import LeaveWagerConfirmation from './LeaveWagerConfirmation';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionInfoPanelProps {
  session: SessionState | GameSession;
  onExit: () => void;
  networkStatus?: NetworkStatus;
  className?: string;
}

const SessionInfoPanel: React.FC<SessionInfoPanelProps> = ({ session, onExit, networkStatus, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);

  if (!session) return null;

  // Get current user and opponent
  const currentUserId = session.initiator.id;
  const opponent = Object.values(session.players).find(
    player => player.id !== currentUserId
  ) as SessionPlayer | undefined;

  // Calculate initial time elapsed
  useEffect(() => {
    const calculateElapsed = () => {
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000 / 60);
      setTimeElapsed(elapsed);
    };

    calculateElapsed();
    
    // Update elapsed time every minute
    const timer = setInterval(calculateElapsed, 60000);
    
    return () => {
      clearInterval(timer);
    };
  }, [session.startTime]);

  // Calculate session end time if session has ended
  useEffect(() => {
    if (session.status === 'finished' || session.status === 'expired') {
      setSessionEndTime(session.endTime || session.lastActivityTime);
    } else {
      setSessionEndTime(null);
    }
  }, [session.status, session.endTime, session.lastActivityTime]);

  const wagerPot = session.wager * 2;

  const handleConfirmExit = () => {
    setShowExitModal(false);
    onExit();
  };

  const formatDisplayTime = () => {
    if (sessionEndTime) {
      const endElapsed = Math.floor((sessionEndTime - session.startTime) / 1000 / 60);
      return `${endElapsed}m duration`;
    }
    return `${timeElapsed}m elapsed`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-black/30 backdrop-blur-sm rounded-lg p-4",
          "w-full md:w-72",
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/70 hover:text-white flex items-center gap-1"
          >
            <span className="text-sm">Session Info</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button 
            onClick={() => setShowExitModal(true)}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded-full transition-colors z-30"
          >
            Leave Wager
          </button>
        </div>

        {/* Wager Pot - Always visible */}
        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 mb-2">
          <Wallet className="w-4 h-4 text-white/70" />
          <span className="text-white text-sm font-medium">₦{wagerPot.toLocaleString()}</span>
          <span className="text-white/60 text-xs ml-auto">Wager Pot</span>
        </div>

        {/* Session Info */}
        <div className="text-white/90 text-xs flex items-center justify-between">
          <span>ID: {session.id.slice(0, 8)}...</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDisplayTime()}
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 mt-4 overflow-hidden"
            >
              {/* Game Status */}
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-white/60 mb-1">Game Status</div>
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      session.status === 'playing' ? "bg-green-500 animate-pulse" :
                      session.status === 'finished' ? "bg-blue-500" :
                      session.status === 'waiting' ? "bg-yellow-500 animate-pulse" :
                      "bg-red-500"
                    )}
                  />
                  <span className="text-white text-sm capitalize">{session.status}</span>
                </div>
              </div>

              {/* Opponent Info */}
              {opponent && (
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-white/60 mb-1">Opponent</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img 
                        src={opponent.avatarUrl || '/images/avatars/default.png'}
                        alt={opponent.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white text-sm">{opponent.nickname}</span>
                    {opponent.status === 'disconnected' && (
                      <span className="text-red-400 text-xs ml-auto">Disconnected</span>
                    )}
                  </div>
                </div>
              )}

              {/* Winner Info (if game is finished) */}
              {session.status === 'finished' && session.winner && (
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-white/60 mb-1">Winner</div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-white text-sm">
                      {session.winner === currentUserId ? 'You' : opponent?.nickname || 'Opponent'}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Leave Wager Confirmation Modal */}
      <LeaveWagerConfirmation 
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleConfirmExit}
        wagerAmount={session.wager}
        opponentName={opponent?.nickname}
        opponentId={opponent?.id}
        initiatorId={session.initiator.id}
      />
    </>
  );
};

export default SessionInfoPanel;