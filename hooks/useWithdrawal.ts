// hooks/useWithdrawal.ts
import { useState } from 'react';

interface WithdrawalParams {
  userId: string;
  amount: number;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
}

interface WithdrawalResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  message?: string;
}

export function useWithdrawal() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processWithdrawal = async (params: WithdrawalParams): Promise<WithdrawalResult> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/payment/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Withdrawal failed');
      }

      return {
        success: true,
        transactionId: data.transactionId,
        message: data.message || 'Withdrawal initiated successfully',
      };
    } catch (error) {
      console.error('Withdrawal hook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processWithdrawal,
    isProcessing,
  };
}
