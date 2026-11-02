'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface LeaveWagerConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  wagerAmount: number;
  opponentName?: string;
  opponentId?: string;
  initiatorId?: string;
}

const LeaveWagerConfirmation: React.FC<LeaveWagerConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  wagerAmount,
  opponentName = 'Opponent',
  opponentId,
  initiatorId
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [displayName, setDisplayName] = useState('Opponent');

  // Determine the correct opponent display name
  useEffect(() => {
    if (!userId) return;

    const formatDisplayName = (name: string): string => name.replace(/^Player-/, '');

    if (userId === initiatorId && opponentId && opponentName) {
      setDisplayName(formatDisplayName(opponentName));
    } else if (userId !== initiatorId && initiatorId && opponentName) {
      setDisplayName(formatDisplayName(opponentName));
    } else {
      setDisplayName(formatDisplayName(opponentName || 'Opponent'));
    }
  }, [userId, opponentName, opponentId, initiatorId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-black/30 backdrop-blur-md rounded-xl border border-white/10",
              "p-6 w-full max-w-md relative z-50 shadow-2xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-white">Leave Wager?</h2>
              
              <div className="text-white/80 space-y-2">
                <p>
                  Are you sure you want to leave this game? Your wager of{' '}
                  <span className="font-semibold text-white">₦{wagerAmount.toLocaleString()}</span>{' '}
                  will be forfeited and transferred to {displayName}.
                </p>
                <p className="text-sm text-white/60">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-4 w-full pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 
                          text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600
                          text-white font-semibold rounded-lg transition-colors"
                >
                  Leave & Forfeit
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeaveWagerConfirmation;