// components/modals/BetConfirmationModal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

interface BetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: string;
  betAmount: string;
  potentialReturn: number;
  isPlacingBet: boolean;
  onConfirm: () => void;
  // Event wager props
  wagerType?: 'p2p' | 'event';
  oddsAtBet?: number;
  platformFeeRate?: number;
}

const BetConfirmationModal: React.FC<BetConfirmationModalProps> = ({
  isOpen,
  onClose,
  selectedOption,
  betAmount,
  potentialReturn,
  isPlacingBet,
  onConfirm,
  wagerType = 'p2p',
  oddsAtBet,
  platformFeeRate = 0.05,
}) => {
  const isEvent = wagerType === 'event';
  const stake = betAmount ? Number(betAmount) : 0;
  const hasOdds = oddsAtBet != null && oddsAtBet > 0;
  const eventReturn = hasOdds ? stake * oddsAtBet! * (1 - platformFeeRate) : null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            Confirm Your Bet
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
            Please review and confirm your bet details below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isEvent ? (
          // ── Event wager layout ────────────────────────────────────────
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Selected Option</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOption}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Stake</span>
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  ₦{stake.toLocaleString()}
                </p>
              </div>
            </div>
            {hasOdds ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Odds</span>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">{oddsAtBet}x</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Potential Return</span>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      ₦{eventReturn!.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  * Return shown after {(platformFeeRate * 100).toFixed(0)}% platform fee.
                </p>
              </>
            ) : (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Potential Return</span>
                <p className="font-semibold text-gray-400">—</p>
              </div>
            )}
          </div>
        ) : (
          // ── P2P wager layout (unchanged) ─────────────────────────────
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Selected Option</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOption}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  ₦{betAmount ? Number(betAmount).toLocaleString() : '0'}
                </p>
              </div>
            </div>
            {betAmount && selectedOption && (
              <div className="p-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Potential Return</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₦{potentialReturn.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPlacingBet}
            className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isPlacingBet} className="bg-purple-600 hover:bg-purple-700 text-white">
            {isPlacingBet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isPlacingBet ? 'Placing Wager...' : 'Confirm Wager'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BetConfirmationModal;
