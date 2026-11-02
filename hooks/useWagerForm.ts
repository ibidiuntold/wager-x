'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useWalletOperations } from './useWalletOperations';

interface UseWagerFormProps {
  minWager: number;
  maxWager: number;
  initialWager?: number;
}

interface UseWagerFormReturn {
  wager: number;
  setWager: (amount: number) => void;
  validateWager: (amount: number) => boolean;
  validateAndSetWager: (amount: number) => void;
  walletStatus: {
    walletBalance: number;
    totalBalance: number;
    isLoading: boolean;
    error: Error | null;
    insufficientFunds: boolean;
  };
  incrementWager: (amount: number) => void;
  decrementWager: (amount: number) => void;
  isWagerValid: boolean;
  errorMessage: string;
}

export const useWagerForm = ({
  minWager,
  maxWager,
  initialWager = minWager
}: UseWagerFormProps): UseWagerFormReturn => {
  const [wager, setWagerState] = useState<number>(initialWager);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isWagerValid, setIsWagerValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);

  const { data: session } = useSession();
  const { toast } = useToast();
  const { checkWalletBalance } = useWalletOperations();

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { walletBalance: wallet } = await checkWalletBalance();
        setWalletBalance(wallet);
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        setError(err as Error);
        toast({
          title: 'Error',
          description: 'Failed to load wallet balance. Please refresh or try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [session, checkWalletBalance, toast]);

  // Validate wager amount whenever wager or balance changes
  useEffect(() => {
    validateWager(wager);
  }, [wager, walletBalance, minWager, maxWager]);

  const validateWager = useCallback((amount: number): boolean => {
    const totalBalance = walletBalance;
    
    if (amount < minWager) {
      setIsWagerValid(false);
      setErrorMessage(`Minimum wager is ₦${minWager.toLocaleString()}`);
      setInsufficientFunds(false);
      return false;
    }
    
    if (amount > maxWager) {
      setIsWagerValid(false);
      setErrorMessage(`Maximum wager is ₦${maxWager.toLocaleString()}`);
      setInsufficientFunds(false);
      return false;
    }
    
    if (amount > totalBalance) {
      setIsWagerValid(false);
      setErrorMessage(`Insufficient balance (₦${totalBalance.toLocaleString()} available)`);
      setInsufficientFunds(true);
      return false;
    }
    
    setIsWagerValid(true);
    setErrorMessage('');
    setInsufficientFunds(false);
    return true;
  }, [minWager, maxWager, walletBalance]);

  const validateAndSetWager = useCallback((amount: number): void => {
    const isValid = validateWager(amount);
    
    if (isValid) {
      setWagerState(amount);
    } else if (insufficientFunds) {
      // If insufficient funds, set to maximum available
      const totalBalance = walletBalance;
      setWagerState(Math.min(amount, totalBalance));
    } else if (amount < minWager) {
      // If below minimum, set to minimum
      setWagerState(minWager);
    } else if (amount > maxWager) {
      // If above maximum, set to maximum
      setWagerState(maxWager);
    }
  }, [validateWager, minWager, maxWager, walletBalance, insufficientFunds]);

  const setWager = useCallback((amount: number): void => {
    setWagerState(amount);
  }, []);

  const incrementWager = useCallback((amount: number): void => {
    setWagerState(current => {
      const newAmount = current + amount;
      const totalBalance = walletBalance;
      const effectiveMax = Math.min(maxWager, totalBalance);
      
      if (newAmount > effectiveMax) {
        if (effectiveMax < maxWager) {
          toast({
            title: 'Balance Limit',
            description: `Your current balance limits your maximum wager to ₦${effectiveMax.toLocaleString()}`,
            duration: 3000
          });
        }
        return effectiveMax;
      }
      
      return newAmount;
    });
  }, [walletBalance, maxWager, toast]);

  const decrementWager = useCallback((amount: number): void => {
    setWagerState(current => {
      const newAmount = current - amount;
      if (newAmount < minWager) {
        return minWager;
      }
      return newAmount;
    });
  }, [minWager]);

  return {
    wager,
    setWager,
    validateWager,
    validateAndSetWager,
    walletStatus: {
      walletBalance,
      totalBalance: walletBalance,
      isLoading,
      error,
      insufficientFunds
    },
    incrementWager,
    decrementWager,
    isWagerValid,
    errorMessage
  };
};

export default useWagerForm;