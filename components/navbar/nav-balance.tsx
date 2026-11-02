'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useBalances } from '@/hooks/useBalances';
import { useAuthSession } from '@/hooks/useAuthSession';
import { formatBalance } from '@/lib/utils';
// Remove: import { useFirestoreConnection } from '@/hooks/useFirestore';

interface NavBalanceProps {
  openWalletModal: (tab: 'deposit' | 'withdraw' | 'history') => void;
}

export default function NavBalance({ openWalletModal }: NavBalanceProps) {
  const { user } = useAuthSession();
  const { balance, loading, error, refresh } = useBalances(user?.id || '');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Remove: const { isConnected, checkConnection } = useFirestoreConnection();

  // Effect to check connection when there's an error
  useEffect(() => {
    if (error) {
      // Remove: checkConnection();
    }
  }, [error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    if (error) {
      // Remove: await checkConnection();
    }
    setIsRefreshing(false);
  };

  const handleTopUp = () => {
    openWalletModal('deposit');
  };

  // Always show loading skeleton during loading, connection issues, errors, or when balance is null
  if (loading || !balance) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 opacity-50">
          <Eye size={16} />
        </div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-5 w-20 rounded" />
        <button
          onClick={handleRefresh}
          className="focus:outline-none transition-transform duration-300 opacity-50"
          aria-label="Refresh balance"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>
    );
  }

  // Only render the actual balance when we have it and are connected
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setIsBalanceHidden(!isBalanceHidden)}
        className="focus:outline-none"
        aria-label={isBalanceHidden ? 'Show balance' : 'Hide balance'}
      >
        {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <button className="text-sm font-medium" onClick={handleTopUp}>
        {isBalanceHidden ? '****' : `₦${formatBalance(balance?.amount || 0)}`}
      </button>

      <button
        onClick={handleRefresh}
        className={`focus:outline-none transition-transform duration-300 ${
          isRefreshing ? 'animate-spin' : 'hover:scale-110'
        }`}
        aria-label="Refresh balance"
      >
        <RefreshCw size={16} />
      </button>

    </div>
  );
}