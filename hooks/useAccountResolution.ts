// hooks/useAccountResolution.ts
import { useState } from 'react';
import { paystackService } from '@/services/paystackService';

interface AccountResolutionResult {
  success: boolean;
  accountName?: string;
  error?: string;
}

export function useAccountResolution() {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState('');

  const resolveAccount = async (accountNumber: string, bankCode: string): Promise<AccountResolutionResult> => {
    if (accountNumber.length !== 10) {
      return { success: false, error: 'Account number must be 10 digits' };
    }

    setIsResolving(true);
    setError('');

    try {
      const result = await paystackService.resolveAccountNumber(accountNumber, bankCode);
      
      if (result.status && result.data?.account_name) {
        return {
          success: true,
          accountName: result.data.account_name
        };
      } else {
        const errorMsg = result.message || 'Failed to verify account';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      const errorMsg = 'Failed to verify account. Please try again.';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setIsResolving(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return {
    resolveAccount,
    isResolving,
    error,
    clearError
  };
}