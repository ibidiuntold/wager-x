// components/UserWagerActions.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Participant } from '@/types/wager';
import { Wager } from '@/types/game.types';

interface UserWagerActionsProps {
  userParticipation: Participant;
  isOpen: boolean;
  isCreator: boolean;
  wager: Wager;
  onIncreaseBet: () => void;
  onCashout: () => void;
  onResolveWager: () => void;
}

const UserWagerActions: React.FC<UserWagerActionsProps> = ({
  userParticipation,
  isOpen,
  isCreator,
  wager,
  onIncreaseBet,
  onCashout,
  onResolveWager
}) => {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-base text-gray-900 dark:text-white">
          Your Wager
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Selected Option</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {userParticipation.optionSelected}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
          <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
            ₦{userParticipation.wagerAmount?.toLocaleString() || '0'}
          </p>
        </div>

        {isOpen && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onIncreaseBet}
            >
              Increase Bet
            </Button>
            {(wager.wagerType ?? 'p2p') === 'p2p' && (
              <Button
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={onCashout}
              >
                Cashout
              </Button>
            )}
          </div>
        )}

        {isCreator && !isOpen && !wager.isResolved && (
          <div className="mt-4">
            <Button
              variant="default"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onResolveWager}
            >
              Resolve Wager
            </Button>
          </div>
        )}

        {!isOpen && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Wager is closed, {isCreator ? "resolve the wager and share the pool." : "no actions available."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UserWagerActions;
