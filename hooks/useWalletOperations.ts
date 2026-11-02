'use client';

import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useState, useCallback } from 'react';

export const useWalletOperations = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const user = session?.user;

  const checkWalletBalance = useCallback(async (): Promise<{ walletBalance: number; }> => {
    if (!user?.id) throw new Error('User not authenticated');
    try {
      const res = await fetch(`/api/users?id=${user.id}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch wallet balance');
      return {
        walletBalance: result.user.walletBalance || 0,
      };
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user]);

  // Example: debitWager operation
  const debitWager = async (amount: number, sessionId: string, gameId?: string): Promise<boolean> => {
    if (!user?.id) return false;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'debit',
          amount,
          sessionId,
          gameId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to debit wager');
      toast({ title: 'Wager debited', description: `Debited ${amount}` });
      return true;
    } catch (err) {
      setError(err as Error);
      toast({ title: 'Error', description: 'Failed to debit wager', variant: 'destructive' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Add other wallet operations as needed, using /api/transactions or /api/users

  return {
    checkWalletBalance,
    debitWager,
    isProcessing,
    error,
  };
};


export default useWalletOperations;