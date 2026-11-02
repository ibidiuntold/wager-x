'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useUserWagers } from '@/hooks/useUserWagers';

// This function is still valid and can be kept as-is.
const calculatePotentialWin = (
  amount: number,
  totalPool: number,
  totalOnSelectedOption: number
): number => {
  if (amount <= 0 || totalOnSelectedOption === 0) return 0;
  return (amount / totalOnSelectedOption) * totalPool;
};


export default function SideWagers() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: session } = useSession();

  // Use the new hook here. It automatically handles fetching on mount.
  // We pass 'open' as the initial status to fetch only active wagers.
  const { wagers, isLoading, error } = useUserWagers('open');

  // This state will hold a list of wagers with added potential win.
  // We don't need a separate effect to fetch wagers anymore, as the hook does it.
  const [wagersWithWin, setWagersWithWin] = useState<any[]>([]);

  useEffect(() => {
    // The wagers array from the hook will be updated when the data is fetched.
    // We can then calculate the potential winnings here.
    if (!isLoading && !error && wagers.length > 0) {
      const detailedWagers = wagers.map((wager) => {
        const potentialWinnings = calculatePotentialWin(
          wager.wagerAmount,
          wager.totalPool,
          wager.totalOnSelectedOption
        );
        return { ...wager, potentialWinnings };
      });
      setWagersWithWin(detailedWagers);
    } else if (!isLoading && wagers.length === 0) {
      setWagersWithWin([]);
    }
  }, [wagers, isLoading, error]);
  
  return (
    <div className="bg-gradient-to-r from-yellow-500 to-red-500 dark:from-yellow-700 dark:to-red-700 rounded-lg p-4 mb-4 relative overflow-hidden">
      <Image
        src="/images/peg-one.png"
        alt="Wagers Background"
        fill
        className="opacity-30 object-cover"
        sizes="(max-width: 768px) 100vw, 768px"
      />
      <div className="relative z-10">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-lg font-semibold text-white">
            My Active Wagers
          </span>
          <button
            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 text-white transition-colors duration-200"
            aria-label={isExpanded ? "Show less wagers" : "Show more wagers"}
          >
            {isExpanded ? (
              <ChevronUp className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6" />
            )}
          </button>
        </div>

        {isExpanded && (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : wagersWithWin.length === 0 ? (
              <div className="text-center py-4">
                <Trophy className="h-8 w-8 text-white/50 mx-auto mb-2" />
                <p className="text-white text-sm">No active wagers</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                {wagersWithWin.slice(0, 4).map((wager) => (
                  <Link 
                    key={wager.id}
                    href={`/wagers/${wager.slug}`}
                    className="block w-full text-left px-4 py-2 text-sm text-white bg-white/20 hover:bg-white/30 rounded transition duration-150 ease-in-out"
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate pr-2">{wager.title}</span>
                      <span className="text-purple-200 whitespace-nowrap">
                        ₦{wager.potentialWinnings.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
