// components/common/wallet/WithdrawTab.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, Loader2, Coins, Settings, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import BankSelector from '../BankSelector';
import { formatBalance } from '@/lib/utils';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { useAccountResolution } from '@/hooks/useAccountResolution';
import banks from '@/components/banks.json';
import type { Settings as AppSettings, UserData } from '@/components/common/wallet/types';

interface WithdrawTabProps {
  currentUserData: UserData | null;
  settings: AppSettings | null;
  selectedBank: string;
  accountNumber: string;
  userName: string;
  setSelectedBank: (bank: string) => void;
  setAccountNumber: (number: string) => void;
  setUserName: (name: string) => void;
  onTabChange: (tab: 'deposit' | 'withdraw' | 'history') => void;
}

const MIN_WITHDRAWAL = Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_AMOUNT) || 5000;
const PROCESSING_FEE_PERCENTAGE = Number(process.env.NEXT_PUBLIC_WITHDRAWAL_CHARGE) || 0.5;

export default function WithdrawTab({
  currentUserData,
  settings,
  selectedBank,
  accountNumber,
  userName,
  setSelectedBank,
  setAccountNumber,
  setUserName,
  onTabChange
}: WithdrawTabProps) {
  const { toast } = useToast();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  // Custom hooks
  const {
    processWithdrawal,
    isProcessing
  } = useWithdrawal();

  const {
    resolveAccount,
    isResolving: isResolvingAccount,
    error: accountResolutionError,
    clearError
  } = useAccountResolution();

  // FIXED: Better data extraction with multiple fallback paths
  const availableBalance = useMemo(() => {
    console.log('WithdrawTab - currentUserData:', currentUserData);

    if (!currentUserData) return 0;

    // Try different possible paths for balance data
    const balance =
      currentUserData.totalBalance ||
      0;

    console.log('WithdrawTab - extracted balance:', balance);
    return Number(balance) || 0;
  }, [currentUserData]);

  // Get user ID with multiple fallback paths
  const userId = useMemo(() => {
    if (!currentUserData) return null;

    return currentUserData.user?.id ||
      currentUserData.id ||
      currentUserData.userId ||
      null;
  }, [currentUserData]);

  // Calculated values - Fee is added to withdrawal, not subtracted from amount received
  const processingFee = useMemo(() => {
    const amount = Number(withdrawalAmount) || 0;
    return (amount * PROCESSING_FEE_PERCENTAGE) / 100;
  }, [withdrawalAmount]);

  const totalDeduction = useMemo(() => {
    const amount = Number(withdrawalAmount) || 0;
    return amount + processingFee; // Total amount to be deducted from balance
  }, [withdrawalAmount, processingFee]);

  const netWithdrawalAmount = useMemo(() => {
    const amount = Number(withdrawalAmount) || 0;
    return amount; // They receive the full amount they requested
  }, [withdrawalAmount]);

  const handleWithdrawalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setWithdrawalAmount(value);
  };

  const handleAccountNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(value);
    clearError();

    if (value.length === 10 && selectedBank) {
      const result = await resolveAccount(value, selectedBank);
      if (result.success && result.accountName) {
        setUserName(result.accountName);
      }
    }
  };

  const handleBankChange = async (code: string) => {
    setSelectedBank(code);
    setUserName('');
    clearError();

    if (accountNumber.length === 10) {
      const result = await resolveAccount(accountNumber, code);
      if (result.success && result.accountName) {
        setUserName(result.accountName);
      }
    }
  };

  const handleWithdraw = async () => {
    if (!userId || !userName || !selectedBank || !accountNumber) {
      console.log('Missing required fields:', { userId, userName, selectedBank, accountNumber });
      return;
    }

    const withdrawAmount = Number(withdrawalAmount);

    // Validate withdrawal amount
    if (withdrawAmount < MIN_WITHDRAWAL) {
      toast({
        title: "Invalid Withdrawal Amount",
        description: `Minimum withdrawal is ${settings?.currencySymbol || '₦'}${MIN_WITHDRAWAL.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }

    const selectedBankDetails = (banks as any[]).find(b => b.code === selectedBank);

    const result = await processWithdrawal({
      userId: userId,
      amount: withdrawAmount,
      accountNumber,
      bankCode: selectedBank,
      bankName: selectedBankDetails?.name || '',
      accountName: userName,
    });

    if (result.success) {
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal request has been submitted and is being processed.",
      });

      // Clear form and switch to history tab
      setWithdrawalAmount('');
      setAccountNumber('');
      setUserName('');
      setSelectedBank('');
      onTabChange('history');
    } else {
      toast({
        title: "Withdrawal Failed",
        description: result.error || "Failed to process withdrawal. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Show loading state if data is not available
  if (!currentUserData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">Loading wallet data...</p>
      </motion.div>
    );
  }

  // Check if balance is sufficient
  if (availableBalance < MIN_WITHDRAWAL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="bg-yellow-500 rounded-full p-3">
            <Info className="h-6 w-6 text-black" />
          </div>
        </div>
        <h3 className="text-xl font-bold">Insufficient Balance</h3>
        <p className="text-gray-500 dark:text-gray-400">
          To create a withdrawal request, the amount on the main balance must be at least {settings?.currencySymbol || '₦'}{MIN_WITHDRAWAL.toLocaleString()}.
        </p>
        <p className="text-sm text-gray-400">
          Current balance: {settings?.currencySymbol || '₦'}{formatBalance(availableBalance)}
        </p>
        <Button onClick={() => onTabChange('deposit')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
          Deposit
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Available Balance Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-green-200/70 dark:bg-green-700/30 rounded-lg p-4 flex justify-between items-center border border-green-300/20 dark:border-green-800/30"
      >
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-gray-600 dark:text-green-100/70" />
          <span className="text-sm text-gray-600 dark:text-green-100/70">Available Balance</span>
        </div>
        <span className="font-bold text-gray-700 dark:text-white">
          {settings?.currencySymbol || '₦'}{formatBalance(availableBalance)}
        </span>
      </motion.div>

      {/* Withdrawal Amount Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="relative">
          <Input
            type="text"
            placeholder={`Enter Withdrawal Amount (Min: ${settings?.currencySymbol || '₦'}${MIN_WITHDRAWAL.toLocaleString()})`}
            value={withdrawalAmount}
            onChange={handleWithdrawalAmountChange}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 pl-10"
            disabled={isProcessing}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        {/* Bank Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <BankSelector
            selectedBank={selectedBank}
            setSelectedBank={handleBankChange}
          />

          <div className="relative">
            <Input
              type="text"
              placeholder="Enter 10-digit Account Number"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
              disabled={!selectedBank || isResolvingAccount || isProcessing}
              maxLength={10}
            />
            {isResolvingAccount && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
          </div>

          {accountResolutionError && (
            <div className="flex items-start space-x-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{accountResolutionError}</p>
            </div>
          )}

          {userName && (
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                Account Name: <span className="font-medium">{userName}</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* Withdrawal Calculation Section */}
        <AnimatePresence>
          {Number(withdrawalAmount) >= MIN_WITHDRAWAL && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-2 overflow-hidden"
            >
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Withdrawal Amount:</span>
                <span className="font-medium text-black dark:text-white">
                  {settings?.currencySymbol || '₦'}{formatBalance(Number(withdrawalAmount))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Processing Fee ({PROCESSING_FEE_PERCENTAGE}%):</span>
                <span className="text-red-500">
                  - {settings?.currencySymbol || '₦'}{formatBalance(processingFee)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-medium">
                <span>Amount to Transfer:</span>
                <span className="text-green-500">
                  {settings?.currencySymbol || '₦'}{formatBalance(netWithdrawalAmount)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Withdrawal Button */}
      <AnimatePresence>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleWithdraw}
              className="w-full bg-gradient-to-tr from-yellow-500 to-yellow-600 hover:bg-yellow-600 hover:bg-gradient-to-r text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(() => {
                const amount = Number(withdrawalAmount) || 0;
                const conditions = {
                  hasAmount: !!withdrawalAmount && withdrawalAmount.trim() !== '',
                  meetsMinimum: amount >= MIN_WITHDRAWAL,
                  notProcessing: !isProcessing,
                  hasBank: !!selectedBank && selectedBank.trim() !== '',
                  hasAccount: !!accountNumber && accountNumber.length === 10,
                  hasName: !!userName && userName.trim() !== '',
                  sufficientBalance: amount <= availableBalance,
                  hasUserId: !!userId
                };

                const isEnabled = Object.values(conditions).every(condition => condition === true);
                return !isEnabled;
              })()}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Withdraw ${settings?.currencySymbol || '₦'}${formatBalance(Number(withdrawalAmount) || 0)}`
              )}
            </Button>
          </motion.div>

          {/* Validation Status Display (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs space-y-1 bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <p className="font-bold">Button Status:</p>
              <p>Amount: {withdrawalAmount || 'Empty'} ({Number(withdrawalAmount) || 0})</p>
              <p>Min Check: {(Number(withdrawalAmount) || 0) >= MIN_WITHDRAWAL ? '✓' : '✗'}</p>
              <p>Bank: {selectedBank || 'None'}</p>
              <p>Account: {accountNumber || 'None'} (Length: {accountNumber.length})</p>
              <p>Name: {userName || 'None'}</p>
              <p>Balance Check: {(Number(withdrawalAmount) || 0) <= availableBalance ? '✓' : '✗'}</p>
              <p>User ID: {userId || 'None'}</p>
              <p>Processing: {isProcessing ? 'Yes' : 'No'}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Notes Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <h4 className="font-bold mb-2">Note:</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <li>Minimum withdrawal amount is {settings?.currencySymbol || '₦'}{MIN_WITHDRAWAL.toLocaleString()}.</li>
          <li>A processing fee of {PROCESSING_FEE_PERCENTAGE}% applies to all withdrawals.</li>
          <li>Bonus balance cannot be withdrawn.</li>
          <li>Maximum per transaction is {settings?.currencySymbol || '₦'}9,999,999.00.</li>
          <li>Ensure your account details are correct as incorrect details may lead to failed transactions.</li>
          <li>Transfers are processed instantly via Paystack.</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}