import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useToast } from "@/components/ui/use-toast";
import DepositTab from './wallet/DepositTab';
import WithdrawTab from './wallet/WithdrawTab';
import HistoryTab from './wallet/HistoryTab';
import { PaymentService } from './wallet/PaymentService';
import { useWalletData } from '@/hooks/useWalletData';
import type { Settings, PaystackResponse, PaymentProcessor, FlutterwaveResponse } from './wallet/types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'deposit' | 'withdraw' | 'history';
  userId: string;
}

export default function WalletModal({ isOpen, onClose, initialTab = 'deposit', userId }: WalletModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const paymentService = useMemo(() => new PaymentService(), []);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [minDeposit] = useState(100);
  const [maxDeposit] = useState(200000);
  const [depositAmount, setDepositAmount] = useState(100);
  const [bonusCode, setBonusCode] = useState('');
  const [showOnlyDeposits, setShowOnlyDeposits] = useState(false);
  const [showOnlyWithdrawals, setShowOnlyWithdrawals] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [settings] = useState<Settings | null>(null);
  const [processors, setProcessors] = useState<Record<string, PaymentProcessor>>({});

  // Function to remove overlay
  const removeOverlay = () => {
    const overlay = document.querySelector(".bg-black\\/50.fixed.inset-0.z-40");
    if (overlay) {
      overlay.remove(); // removes the overlay element
    }
  };

  // FIXED: Only skip cache when modal is closed, always fetch when open
  const { currentUserData, isLoading, error, refresh } = useWalletData({
    skipCache: false  // Always allow caching and fetching
  });

  // Debug logging to see what we're getting
  // useEffect(() => {
  //   console.log('WalletModal - currentUserData:', currentUserData);
  //   console.log('WalletModal - isLoading:', isLoading);
  //   console.log('WalletModal - error:', error);
  //   console.log('WalletModal - userId:', userId);
  // }, [currentUserData, isLoading, error, userId]);

  const initializePayment = async (processorId: string, reference: string) => {
    try {
      setIsProcessing(true);

      const result = await paymentService.verifyPayment(reference, userId, processorId);

      if (result.success) {
        if (refresh) await refresh();
        toast({
          title: "Deposit Successful",
          description: `₦${result.amount.toLocaleString()} has been added to your wallet`,
          duration: 5000,
        });
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Payment verification failed.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const enabledProcessors = paymentService.getEnabledProcessors();
    setProcessors(enabledProcessors);
  }, [paymentService]);

  useEffect(() => {
    if (error && isOpen) {
      console.error('Wallet data error:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, isOpen, toast]);

  // Force refresh when modal opens
  useEffect(() => {
    if (isOpen && refresh) {
      console.log('Modal opened, refreshing wallet data...');
      refresh();
    }
  }, [isOpen, refresh]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-40" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 text-gray-900 
          dark:text-white rounded-lg p-6 z-40 min-h-[740px] max-h-[calc(100%-64px)] overflow-y-auto"
        >
          <Dialog.Title className="text-2xl font-bold mb-4">Your Wallet</Dialog.Title>
          <Dialog.Description id="wallet-description" className="sr-only">
            Manage your wallet funds, make deposits, withdrawals, and view transaction history
          </Dialog.Description>
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          {/* Debug info - remove in production */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              <p>Debug: User Data: {JSON.stringify(currentUserData)}</p>
              <p>Debug: Loading: {isLoading.toString()}</p>
              <p>Debug: Error: {error}</p>
            </div>
          )} */}

          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
            </div>
          ) : (
            <Tabs.Root value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'deposit' | 'withdraw' | 'history')}>
              <Tabs.List className="flex mb-4 bg-gray-200 dark:bg-gray-700 rounded-full p-1">
                {['deposit', 'withdraw', 'history'].map((tab) => (
                  <Tabs.Trigger
                    key={tab}
                    value={tab}
                    className="flex-1 px-4 py-2 focus:outline-none rounded-full capitalize text-center transition-colors duration-200
                      data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600
                      data-[state=active]:text-gray-900 dark:data-[state=active]:text-white
                      data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400"
                  >
                    {tab}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <Tabs.Content value="deposit">
                <DepositTab
                  depositAmount={depositAmount}
                  minDeposit={minDeposit}
                  maxDeposit={maxDeposit}
                  bonusCode={bonusCode}
                  isProcessing={isProcessing}
                  processors={processors}
                  onDepositAmountChange={setDepositAmount}
                  onBonusCodeChange={setBonusCode}
                  userEmail={currentUserData?.email}
                  userId={userId}
                  onClose={onClose}
                  paymentService={paymentService}
                  refresh={refresh}
                  toast={toast}
                />
              </Tabs.Content>

              <Tabs.Content value="withdraw">
                <WithdrawTab
                  currentUserData={currentUserData}
                  settings={settings}
                  selectedBank={selectedBank}
                  accountNumber={accountNumber}
                  userName={userName}
                  setSelectedBank={setSelectedBank}
                  setAccountNumber={setAccountNumber}
                  setUserName={setUserName}
                  onTabChange={setActiveTab}
                />
              </Tabs.Content>

              <Tabs.Content value="history">
                <HistoryTab
                  showOnlyDeposits={showOnlyDeposits}
                  showOnlyWithdrawals={showOnlyWithdrawals}
                  setShowOnlyDeposits={setShowOnlyDeposits}
                  setShowOnlyWithdrawals={setShowOnlyWithdrawals}
                  userId={userId}
                />
              </Tabs.Content>
            </Tabs.Root>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}