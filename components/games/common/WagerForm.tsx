'use client';

import React, { useState, useEffect } from 'react';
import { WalletData } from '@/types/game.types';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { useWalletOperations } from '@/hooks/useWalletOperations';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WagerFormProps {
  minWager: number;
  maxWager: number;
  wager: number;
  onWagerChange: (amount: number) => void;
  className?: string;
  animate?: boolean;
  loading?: boolean;
  userId?: string; // Added userId prop
}

export default function WagerForm({ userId, ...props }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users?id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user || null);
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUserData();
  }, [userId]);

  if (loading) return <div>Loading user data...</div>;
  if (error) return <div>{error}</div>;

  const { user } = React.useAuth(); // Assuming useAuth is available globally or via context
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(props.loading);

  const { checkWalletBalance } = useWalletOperations();

  // Initialize with min wager if current wager is invalid
  useEffect(() => {
    if (props.wager < props.minWager || isNaN(props.wager)) {
      props.onWagerChange(props.minWager);
    }
  }, [props.minWager, props.wager, props.onWagerChange]);

  // Fetch wallet data from Firestore
  useEffect(() => {
    if (userData && userData.walletBalance !== undefined) {
      setWalletData({
        walletBalance: userData.walletBalance || 0,
        currency: userData.currency || 'NGN'
      });
      setIsLoading(false);
    } else if (userData === null) { // Handle case where userData is null (e.g., loading)
      setIsLoading(true);
    }
  }, [userData]);

  // Alternative wallet data fetching using our hook if Firestore query fails
  useEffect(() => {
    const fetchWalletData = async () => {
      if (user && userData === null) { // Only fetch if userData is null (i.e., not yet fetched)
        try {
          setIsLoading(true);
          const balanceData = await checkWalletBalance();
          setWalletData({
            walletBalance: balanceData.walletBalance,
            currency: 'NGN'
          });
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWalletData();
  }, [user, userData, checkWalletBalance]);

  // Validate wager amount whenever relevant data changes
  useEffect(() => {
    // Validate wager amount
    const validateWager = () => {
      const valid = props.wager >= props.minWager &&
        props.wager <= props.maxWager &&
        props.wager <= (walletData ? (walletData.walletBalance) : props.maxWager);

      setIsValid(valid);
    };

    validateWager();
  }, [props.wager, props.minWager, props.maxWager, walletData]);

  const totalBalance = (walletData?.walletBalance || 0);
  const effectiveMaxWager = Math.min(props.maxWager, totalBalance || props.maxWager);

  const handleWagerUpdate = (newAmount: number) => {
    if (newAmount > totalBalance && totalBalance > 0) {
      setShowDepositModal(true);
      return;
    }

    // Ensure wager is within bounds
    let boundedAmount = Math.max(props.minWager, Math.min(newAmount, effectiveMaxWager));
    props.onWagerChange(boundedAmount);
  };

  const increment = () => {
    const newAmount = props.wager + 100;
    handleWagerUpdate(newAmount);
  };

  const decrement = () => {
    const newAmount = props.wager - 100;
    if (newAmount >= props.minWager) {
      props.onWagerChange(newAmount);
    }
  };

  const incrementBy = (amount: number) => {
    const newAmount = props.wager + amount;
    handleWagerUpdate(newAmount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      handleWagerUpdate(value);
    }
  };

  const wrapInMotion = (content: React.ReactNode) => {
    if (!props.animate) return content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  };

  // Render skeleton loader during loading state
  if (isLoading) {
    return wrapInMotion(
      <div className={cn(
        "bg-black/50 dark:bg-black/30 backdrop-blur-sm rounded-lg p-4",
        "w-full md:w-72",
        props.className
      )}>
        <div className="flex flex-col h-full justify-between">
          {/* Top section with label and balance */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/70 text-sm">Wager Amount</span>
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
          </div>

          {/* Main content */}
          <div className="space-y-4">
            {/* Wager Input */}
            <div className="h-10 bg-white/10 rounded-lg animate-pulse"></div>

            {/* Quick Increment Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-white/10 rounded-lg animate-pulse"></div>
              ))}
            </div>

            {/* Min/Max Indicators */}
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return wrapInMotion(
    <div className={cn(
      "bg-black/50 dark:bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-5",
      "w-full md:w-72",
      props.className
    )}>
      <div className="flex flex-col h-full justify-between">
        {/* Top section with label and balance */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-white/70 text-sm">Wager Amount</span>
          {walletData && (
            <div className="flex items-center">
              <span className="text-white/80 text-xs">
                Balance: ₦{totalBalance.toLocaleString()}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 p-1 rounded hover:bg-white/10">
                      <Info className="w-3 h-3 text-white/60" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Wallet: ₦{walletData.walletBalance.toLocaleString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {/* Wager Input */}
          <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
            <button
              onClick={decrement}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full",
                "text-white/80 hover:text-white hover:bg-white/10 transition-colors",
                props.wager <= props.minWager && "opacity-50 cursor-not-allowed"
              )}
              disabled={props.wager <= props.minWager}
              type="button"
            >
              -
            </button>
            <div className="relative flex items-center">
              <span className="text-white/70 mr-1">₦</span>
              <input
                type="number"
                value={props.wager}
                onChange={handleInputChange}
                min={props.minWager}
                max={effectiveMaxWager}
                className="w-20 text-center bg-transparent text-white focus:outline-none"
              />
            </div>
            <button
              onClick={increment}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full",
                "text-white/80 hover:text-white hover:bg-white/10 transition-colors",
                props.wager >= effectiveMaxWager && "opacity-50 cursor-not-allowed"
              )}
              disabled={props.wager >= effectiveMaxWager}
              type="button"
            >
              +
            </button>
          </div>

          {/* Quick Increment Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  if (amount + props.wager > effectiveMaxWager) return;
                  incrementBy(amount);
                }}
                disabled={props.wager + amount > effectiveMaxWager}
                className={cn(
                  "py-1.5 bg-white/20 text-white text-xs rounded-lg",
                  "hover:bg-white/30 transition-colors flex items-center justify-center",
                  props.wager + amount > effectiveMaxWager && "opacity-50 cursor-not-allowed"
                )}
                type="button"
              >
                +{amount}
              </button>

            ))}
          </div>

          {/* Min/Max Indicators */}
          <div className="flex justify-between text-xs text-white/60 px-1">
            <span>Min: ₦{props.minWager.toLocaleString()}</span>
            <span>Max: ₦{effectiveMaxWager.toLocaleString()}</span>
          </div>

          {/* Validation Message */}
          {!isValid && totalBalance < props.wager && (
            <div className="text-red-400 text-xs px-1 pt-1">
              Insufficient balance. Add funds to wager this amount.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}