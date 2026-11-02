// components/modals/IncreaseBetModal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Participant } from '@/types/wager';

interface IncreaseBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  increaseBetAmount: string;
  setIncreaseBetAmount: (amount: string) => void;
  userParticipation?: Participant | null;
  calculatePotentialWinIncrease: (amount: string) => number;
  isIncreasing: boolean;
  onConfirm: () => void;
}

const IncreaseBetModal: React.FC<IncreaseBetModalProps> = ({
  isOpen,
  onClose,
  increaseBetAmount,
  setIncreaseBetAmount,
  userParticipation,
  calculatePotentialWinIncrease,
  isIncreasing,
  onConfirm
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            Increase Your Bet
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
            Add more funds to your existing bet to increase your potential return.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Amount (₦)
            </label>
            <Input
              type="number"
              value={increaseBetAmount}
              onChange={(e) => setIncreaseBetAmount(e.target.value)}
              placeholder="Enter amount to add"
              className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus-visible:ring-purple-600"
              min={0}
            />
          </div>
          {increaseBetAmount && (
            <div className="p-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600 dark:text-gray-400">New Total Bet</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₦{(Number(userParticipation?.wagerAmount || 0) + Number(increaseBetAmount)).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600 dark:text-gray-400">New Potential Win</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    ₦{calculatePotentialWinIncrease(increaseBetAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isIncreasing}
            className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isIncreasing} className="bg-purple-600 hover:bg-purple-700 text-white">
            {isIncreasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isIncreasing ? 'Increasing...' : 'Increase Bet'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IncreaseBetModal;
