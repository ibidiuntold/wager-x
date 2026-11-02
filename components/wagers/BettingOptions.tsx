import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BettingOption {
  name: string;
  odds?: number;
}

interface BettingOptionsProps {
  options: BettingOption[];
  selectedOption: string;
  isExpired: boolean;
  onSelectOption: (option: string) => void;
  // wager-type split props
  wagerType: 'p2p' | 'event';
  userStake: number;
  totalStakePerOption: Record<string, number>;
}

export const BettingOptions: React.FC<BettingOptionsProps> = ({
  options,
  selectedOption,
  isExpired,
  onSelectOption,
  wagerType,
  userStake,
  totalStakePerOption,
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Betting Options</CardTitle>
      <CardDescription>Select your preferred outcome</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <div
            key={option.name}
            onClick={() => !isExpired && onSelectOption(option.name)}
            className={cn(
              "p-6 rounded-xl border-2 transition-all relative bg-white dark:bg-gray-900",
              selectedOption === option.name
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "border-gray-200 dark:border-gray-700",
              isExpired ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-purple-300"
            )}
          >
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{option.name}</h3>
              </div>
              {wagerType === 'p2p' ? (
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Est. Return</p>
                  {(totalStakePerOption[option.name] ?? 0) > 0 ? (
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      ₦{(
                        (userStake / totalStakePerOption[option.name]) *
                        Object.values(totalStakePerOption).reduce((a, b) => a + b, 0)
                      ).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Odds</p>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {option.odds}x
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
