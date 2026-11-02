import React, { useState, memo, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWalletData } from '@/hooks/useWalletData';

interface WalletBalanceProps {
  openWalletModal: (tab: 'deposit' | 'withdraw' | 'history') => void;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ openWalletModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ Wallet state from hook
  const { currentUserData: userData, isLoading, error, refresh } = useWalletData();

  const totalBalance =
    (Number(userData?.walletBalance) || 0);

  const balanceRef = useRef<HTMLDivElement>(null);
  const hasRefreshedOnView = useRef(false);

  // ✅ Only refresh ONCE when component first enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRefreshedOnView.current) {
          refresh();
          hasRefreshedOnView.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (balanceRef.current) {
      observer.observe(balanceRef.current);
    }

    return () => observer.disconnect();
  }, [refresh]);

  // ✅ Refresh wallet whenever modal is opened
  const handleOpenWalletModal = useCallback(
    (tab: 'deposit' | 'withdraw' | 'history') => {
      openWalletModal(tab);
      refresh();
    },
    [openWalletModal, refresh]
  );

  const formatBalance = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  if (isLoading && !userData) {
    return (
      <div className="animate-pulse h-24 bg-gray-300 dark:bg-gray-700 rounded-lg" />
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        Failed to load wallet balance. <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div
      ref={balanceRef}
      className="bg-gray-300 dark:bg-gray-700 rounded-lg p-4 mb-4"
    >
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Balance: ₦{formatBalance(totalBalance)}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-900 transition-colors duration-200"
          aria-label={
            isExpanded ? 'Collapse balance details' : 'Expand balance details'
          }
        >
          {isExpanded ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <ChevronDown className="h-6 w-6" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-2 bg-gray-200 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex flex-row space-x-16 justify-between">
            <div className="space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Basic: ₦{formatBalance(userData?.walletBalance || 0)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 text-gray-400 dark:text-gray-600"
              onClick={() => handleOpenWalletModal('history')}
            >
              <History className="h-7 w-7" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="w-full mt-4 text-slate-700 bg-gradient-to-tr from-slate-100 to-slate-200 hover:bg-purple-600 hover:text-gray-100 relative"
              onClick={() => handleOpenWalletModal('deposit')}
            >
              <span className="flex items-center justify-center">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                Deposit
              </span>
            </Button>
            <Button
              size="sm"
              className="w-full mt-4 text-slate-100 bg-gradient-to-tr from-purple-600 to-purple-700 hover:bg-gradient-to-r hover:text-gray-100 relative"
              onClick={() => handleOpenWalletModal('withdraw')}
            >
              <span className="flex items-center justify-center">Withdraw</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(WalletBalance);