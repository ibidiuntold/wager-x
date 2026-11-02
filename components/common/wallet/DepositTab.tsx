// components/common/wallet/DepositTab.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentProcessor } from './types';
import type { PaymentService } from './PaymentService';

// Dynamic import for Paystack (client-side only)
let usePaystackPayment: any = null;

interface DepositTabProps {
  depositAmount: number;
  minDeposit: number;
  maxDeposit: number;
  bonusCode: string;
  isProcessing: boolean;
  processors: Record<string, PaymentProcessor>;
  onDepositAmountChange: (value: number) => void;
  onBonusCodeChange: (value: string) => void;
  userEmail?: string;
  userId: string;
  onClose: () => void;
  paymentService: PaymentService;
  refresh?: () => Promise<void> | void;
  toast: any;
}

const quickAmounts = [100, 200, 500, 1000, 2000, 5000, 7500, 10000];

export default function DepositTab({
  depositAmount,
  minDeposit,
  maxDeposit,
  bonusCode,
  isProcessing: parentProcessing,
  processors,
  onDepositAmountChange,
  onBonusCodeChange,
  userEmail,
  userId,
  onClose,
  paymentService,
  refresh,
  toast
}: DepositTabProps) {
  const [isProcessing, setIsProcessing] = useState(parentProcessing);
  const [isClient, setIsClient] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Ensure we're on the client side and load Paystack dynamically
  useEffect(() => {
    setIsClient(true);

    // Dynamically import react-paystack only on client side
    const loadPaystack = async () => {
      try {
        const { usePaystackPayment: paystackHook } = await import('react-paystack');
        usePaystackPayment = paystackHook;
        setPaystackLoaded(true);
      } catch (error) {
        console.error('Failed to load Paystack:', error);
      }
    };

    loadPaystack();
  }, []);

  const handleIncrement = () => {
    onDepositAmountChange(Math.min(depositAmount + 100, maxDeposit));
  };

  const handleDecrement = () => {
    onDepositAmountChange(Math.max(depositAmount - 100, minDeposit));
  };

  const handleQuickAdd = (amount: number) => {
    onDepositAmountChange(amount);
  };

  const renderPaystackButton = () => {
    // Only render Paystack button if we're on client and Paystack is loaded
    if (!isClient || !paystackLoaded || !processors.paystack || !usePaystackPayment) {
      return (
        <motion.div>
          <Button
            disabled={true}
            className="w-full flex items-center justify-center py-6"
          >
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading Paystack...
          </Button>
        </motion.div>
      );
    }

    const paystackConfig = {
      reference: new Date().getTime().toString(),
      email: userEmail || "noemail@example.com",
      amount: depositAmount * 100, // Paystack expects amount in kobo
      publicKey: processors.paystack.public_key,
      currency: "NGN",
      metadata: {
        userId,
        bonusCode,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: userId,
          },
          {
            display_name: "Bonus Code",
            variable_name: "bonus_code",
            value: bonusCode || "N/A",
          },
        ],
      },
    };

    const initializePaystack = usePaystackPayment(paystackConfig);

    const handlePayment = () => {
      onClose(); // close modal immediately on payment initiation

      initializePaystack({
        onSuccess: async (response: any) => {
          try {
            setIsProcessing(true);

            const result = await paymentService.verifyPayment(
              response.reference,
              userId,
              "paystack"
            );

            if (result.success) {
              if (refresh) await refresh();
              toast({
                title: "Deposit Successful",
                description: `₦${result.amount.toLocaleString()} has been added to your wallet`,
                duration: 5000,
              });
              onClose();
            } else {
              throw new Error(result.error || "Verification failed");
            }
          } catch (error) {
            toast({
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : "Payment verification failed.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        onClose: () => {
          // user closed Paystack popup without paying
          onClose();
        },
      });
    };

    return (
      <motion.div>
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full flex items-center justify-center py-6"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <>
              <span className="mr-2">Pay ₦{depositAmount.toLocaleString()} with</span>
              <img src="/images/logo/paystack.png" alt="paystack logo" className="h-4 object-contain" />
            </>
          )}
        </Button>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Amount Input */}
      <motion.div
        className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1"
        whileTap={{ scale: 0.98 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            className="rounded-full w-10 h-10 flex-shrink-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </motion.div>

        <Input
          type="number"
          value={depositAmount}
          onChange={(e) => onDepositAmountChange(Number(e.target.value))}
          className="flex-grow bg-transparent border-none text-center text-xl font-bold"
        />

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            className="rounded-full w-10 h-10 flex-shrink-0"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </motion.div>
      </motion.div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Enter an amount from ₦{minDeposit.toLocaleString()} to ₦{maxDeposit.toLocaleString()}
      </p>

      {/* Quick Amounts */}
      <motion.div className="grid grid-cols-4 gap-2">
        <AnimatePresence>
          {quickAmounts.map((amount, index) => (
            <motion.div
              key={amount}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { delay: index * 0.05 }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                onClick={() => handleQuickAdd(amount)}
                className="w-full"
              >
                {amount.toLocaleString()}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Bonus Code */}
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          placeholder="Enter bonus code"
          value={bonusCode}
          onChange={(e) => onBonusCodeChange(e.target.value)}
          className="flex-grow bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
        />
        <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Payment Methods */}
      <motion.div className="space-y-2">
        <AnimatePresence>
          {Object.entries(processors).map(([id], index, array) => (
            <React.Fragment key={id}>
              {id === 'paystack'
                ? renderPaystackButton()
                : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => {
                        onClose();
                        // onInitializePayment(id, new Date().getTime().toString());
                      }}
                      disabled={isProcessing}
                      variant="default"
                      className={`w-full flex items-center justify-center space-x-2 py-6 text-md font-medium
                        bg-gradient-to-tr from-slate-100 to-slate-300 hover:from-red-600 hover:to-orange-500
                        hover:bg-gradient-to-r text-slate-800 hover:text-slate-100`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <>
                          <span className="mr-2">Pay ₦{depositAmount.toLocaleString()} with</span>
                          <img
                            src={`/images/logo/${id}.png`}
                            alt={`${id} logo`}
                            className="h-4 object-contain"
                          />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

              {index < array.length - 1 && (
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">or</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>

        {Object.keys(processors).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 text-gray-500"
          >
            No payment methods available. Please contact support.
          </motion.div>
        )}
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <h4 className="font-bold mb-2">Note:</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <li>Minimum deposit amount is NGN 100.00 - you can deposit at least NGN 100.00 in one transaction.</li>
          <li>Maximum per transaction is NGN 9,999,999.00 - you can deposit up to NGN 9,999,999.00 in one transaction.</li>
          <li>We do not share your payment information. It is used for transaction verification only.</li>
          <li>If you have any issues, please contact customer support. Using too many cards or bank accounts for deposits may cause the deposit to be blocked and your account restricted.</li>
          <li>Deposit is free, there are no transaction fees.</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}