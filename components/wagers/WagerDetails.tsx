// Updated WagerDetails component to match the provided design
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useWager, useIncreaseBet, useCashout, useResolveWager } from '@/hooks/useWagerHooks';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AuthModal from '../auth/AuthModal';
import CommentSection from './CommentSection';

// Import all our modular components
import UserWagerActions from './UserWagerActions';
import BetConfirmationModal from './modals/BetConfirmationModal';
import IncreaseBetModal from './modals/IncreaseWagerModal';
import CashoutModal from './modals/CashoutModal';
import ResolveWagerModal from './modals/ResolveWagerModal';
import { ProcessedOption, Participant } from '@/types/wager';
import { BettingOptions } from '@/components/wagers/BettingOptions';

interface WagerDetailsProps { }

const WagerDetails: React.FC<WagerDetailsProps> = () => {
  const params = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const user = session?.user || null;

  // All hooks remain the same...
  const {
    wager,
    participants,
    isLoading,
    actualWagerId,
    isCreator,
    placeBet,
    refetchWager,
    refetchParticipants
  } = useWager(params.slug as string);

  const { increaseBet, isIncreasing } = useIncreaseBet();
  const { cashout, isCashingOut } = useCashout();
  const { resolveWager } = useResolveWager();

  // State
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [showBetConfirmation, setShowBetConfirmation] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBet, setPendingBet] = useState<{ amount: string; option: string } | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingOption, setResolvingOption] = useState<string>("");
  const [isResolving, setIsResolving] = useState(false);
  const [showIncreaseBetModal, setShowIncreaseBetModal] = useState(false);
  const [increaseBetAmount, setIncreaseBetAmount] = useState<string>('');
  const [showCashoutConfirmation, setShowCashoutConfirmation] = useState(false);
  const [platformFeeRate, setPlatformFeeRate] = useState(0.05);

  // Fetch platform fee rate from settings (fall back to 0.05 silently)
  React.useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const rate = d?.settings?.platformFeeRate;
        if (typeof rate === 'number' && rate > 0 && rate < 1) {
          setPlatformFeeRate(rate);
        }
      })
      .catch(() => {});
  }, []);

  // All computed values remain the same...
  const isExpired = useMemo(() => {
    return wager?.expiresAt ? new Date() > new Date(wager.expiresAt) : false;
  }, [wager?.expiresAt]);

  const isClosed = useMemo(() => {
    return isExpired || wager?.status === 'closed';
  }, [isExpired, wager?.status]);

  const isOpen = useMemo(() => {
    return !isClosed && wager?.status === 'open';
  }, [isClosed, wager?.status]);

  const userParticipation = useMemo(() => {
    return user ? participants.find(p => p.userId === (user as any).id) : null;
  }, [participants, user]);

  const totalPool = useMemo(() => {
    return participants.reduce((sum, p) => sum + (typeof p.wagerAmount === "number" ? p.wagerAmount : 0), 0);
  }, [participants]);

  const potentialReturn = useMemo(() => {
    const betAmountNum = parseFloat(betAmount);
    if (isNaN(betAmountNum) || betAmountNum <= 0 || !selectedOption) {
      return 0;
    }
    const currentTotalOnOption = participants
      .filter(p => p.optionSelected === selectedOption)
      .reduce((sum, p) => sum + (typeof p.wagerAmount === "number" ? p.wagerAmount : 0), 0);
    const newTotalOnOption = currentTotalOnOption + betAmountNum;
    const newTotalPool = totalPool + betAmountNum;
    if (newTotalOnOption === 0) return 0;
    return (betAmountNum / newTotalOnOption) * newTotalPool;
  }, [betAmount, selectedOption, participants, totalPool]);

  const processedOptions: ProcessedOption[] = useMemo(() => {
    if (!wager?.options) return [];
    try {
      const options = typeof wager.options === 'string' ? JSON.parse(wager.options) : wager.options;
      return options.map((option: { name: string } | string) => {
        const optionName = typeof option === 'string' ? option : option.name;
        const totalAmountOnOption = participants
          .filter(p => p.optionSelected === optionName)
          .reduce((sum, p) => sum + (p.wagerAmount || 0), 0);

        return {
          name: optionName,
          totalAmount: totalAmountOnOption,
        };
      });
    } catch (e) {
      console.error("Failed to parse wager options", e);
      return [];
    }
  }, [wager?.options, participants]);

  const totalStakePerOption = useMemo(() =>
    processedOptions.reduce<Record<string, number>>((acc, o) => {
      acc[o.name] = o.totalAmount;
      return acc;
    }, {}),
  [processedOptions]);

  const parsedOptions = useMemo(() => {
    if (!wager?.options) return [];
    try {
      return typeof wager.options === 'string'
        ? JSON.parse(wager.options)
        : wager.options;
    } catch {
      return [];
    }
  }, [wager?.options]);

  // Derive oddsAtBet for the currently selected option (event wagers only)
  const oddsAtBet = useMemo(() => {
    if ((wager?.wagerType ?? 'p2p') !== 'event' || !selectedOption) return undefined;
    const matched = (parsedOptions as Array<{ name: string; odds?: number }>)
      .find(o => o.name === selectedOption);
    return matched?.odds ?? undefined;
  }, [wager?.wagerType, parsedOptions, selectedOption]);

  // All callbacks and event handlers remain the same...
  const calculatePotentialWinIncrease = useCallback((additionalAmount: string): number => {
    if (!additionalAmount || !wager || !userParticipation) return 0;

    const additionalAmountNum = parseFloat(additionalAmount);
    if (isNaN(additionalAmountNum)) return 0;

    const currentBetAmount = Number(userParticipation.wagerAmount);
    const newTotalBetAmount = currentBetAmount + additionalAmountNum;

    const totalOnSelectedOption = participants
      .filter(p => p.optionSelected === userParticipation.optionSelected)
      .reduce((sum, p) => sum + (typeof p.wagerAmount === "number" ? p.wagerAmount : 0), 0) + additionalAmountNum;

    const totalPoolWithNewBet = totalPool + additionalAmountNum;

    if (totalOnSelectedOption === 0) return 0;

    const potentialWin = (newTotalBetAmount / totalOnSelectedOption) * totalPoolWithNewBet;
    return Number.isFinite(potentialWin) ? potentialWin : 0;
  }, [userParticipation, participants, totalPool, wager]);

  const calculateCashoutAmount = useCallback((): number => {
    if (!userParticipation) return 0;
    const cashoutFeePercentage = 0.20;
    return Number(userParticipation.wagerAmount) * (1 - cashoutFeePercentage);
  }, [userParticipation]);

  // Event handlers
  const handlePlaceBet = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedOption || !betAmount || !actualWagerId) {
      toast({
        title: 'Missing Information',
        description: 'Please select an option and enter bet amount',
        variant: 'destructive'
      });
      return;
    }

    setIsPlacingBet(true);
    try {
      const success = await placeBet(selectedOption, Number(betAmount));
      if (success) {
        toast({
          title: 'Bet Placed Successfully! 🎉',
          description: `You bet ₦${Number(betAmount).toLocaleString()} on ${selectedOption}`
        });
        setSelectedOption('');
        setBetAmount('');
        setShowBetConfirmation(false);
        refetchWager();
        refetchParticipants();
      }
    } catch (error) {
      toast({
        title: 'Error Placing Bet',
        description: error instanceof Error ? error.message : 'Failed to place bet',
        variant: 'destructive'
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingBet) {
      setSelectedOption(pendingBet.option);
      setBetAmount(pendingBet.amount);
      setPendingBet(null);
      setShowBetConfirmation(true);
    }
  };

  const handleIncreaseBet = async () => {
    if (!user || !userParticipation || !actualWagerId) {
      toast({ title: 'Error', description: 'User, participation, or wager ID missing.', variant: 'destructive' });
      return;
    }

    const additionalAmount = Number(increaseBetAmount);
    if (isNaN(additionalAmount) || additionalAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount to increase your bet.', variant: 'destructive' });
      return;
    }

    const success = await increaseBet(userParticipation.wagerId, userParticipation.participantId, additionalAmount);

    if (success) {
      setShowIncreaseBetModal(false);
      setIncreaseBetAmount('');
      refetchWager();
      refetchParticipants();
    }
  };

  const handleCashout = async () => {
    if (!user || !userParticipation || !actualWagerId) {
      toast({ title: 'Error', description: 'User, participation, or wager ID missing.', variant: 'destructive' });
      return;
    }

    const success = await cashout(userParticipation.wagerId, userParticipation.participantId);

    if (success) {
      setShowCashoutConfirmation(false);
      refetchWager();
      refetchParticipants();
    }
  };

  const handleResolveWager = async () => {
    if (!actualWagerId || !resolvingOption) {
      toast({
        title: "Missing Information",
        description: "Please select an option to resolve the wager.",
        variant: "destructive",
      });
      return;
    }

    setIsResolving(true);
    try {
      const success = await resolveWager(actualWagerId, resolvingOption);
      if (success) {
        toast({
          title: "Wager Resolved 🎉",
          description: `The wager has been resolved with "${resolvingOption}" as the winning option.`,
        });
        setShowResolveModal(false);
      }
    } catch (error) {
      toast({
        title: "Error Resolving Wager",
        description: error instanceof Error ? error.message : "Failed to resolve wager",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!wager) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Wager Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">The wager you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Back to Wagers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-4 sm:py-6">
      {/* Back Button */}
      <div className="mb-4 mt-20 container mx-auto min-w-60">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Wagers
        </Button>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* Left Column - Main Wager Card */}
          <div className="flex-1 space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              {/* Header with badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {wager.category}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${isOpen
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {wager.title}
              </h1>

              {/* Expiry */}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <span className="text-sm">
                  Expires on {wager.expiresAt ? new Date(wager.expiresAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>

              {/* Choose Your Pick Section */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Choose Your Pick</h2>
                <BettingOptions
                  options={parsedOptions}
                  selectedOption={selectedOption}
                  isExpired={isClosed}
                  onSelectOption={setSelectedOption}
                  wagerType={wager.wagerType ?? 'p2p'}
                  userStake={parseFloat(betAmount) || 0}
                  totalStakePerOption={totalStakePerOption}
                />
              </div>

              {/* How It Works */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">How It Works</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-400">
                  <li>Choose your team from the options above</li>
                  <li>Enter your bet amount (minimum ₦{wager.minimumEntry?.toLocaleString() || '100'})</li>
                  <li>Confirm your bet after the deadline</li>
                </ol>
              </div>
            </div>
            <div className='hidden lg:block'>
              <CommentSection wagerId={actualWagerId || ''} />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full lg:w-80 space-y-4">

            {/* Pool Information */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Pool Information</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                ₦{totalPool.toLocaleString()}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Minimum Entry</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">₦{wager.minimumEntry?.toLocaleString() || '100'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Participants</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Current Bet</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">₦{userParticipation?.wagerAmount?.toLocaleString() || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Betting Form or User Actions */}
            {!userParticipation ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Bet Amount (₦)</h3>
                <div className="space-y-4">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder={`Enter amount (min ₦${wager.minimumEntry?.toLocaleString() || '100'})`}
                    className="w-full p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-0 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    min={wager.minimumEntry || 100}
                  />

                  <button
                    onClick={() => setShowBetConfirmation(true)}
                    disabled={!selectedOption || !betAmount || isClosed}
                    className="w-full py-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedOption && Number(betAmount) >= (wager.minimumEntry || 100)
                      ? `Place Bet on ${selectedOption}`
                      : 'SELECT A TEAM TO CONTINUE'
                    }
                  </button>
                </div>
              </div>
            ) : (
              <UserWagerActions
                userParticipation={userParticipation}
                isOpen={isOpen}
                isCreator={isCreator}
                wager={wager}
                onIncreaseBet={() => {
                  setIncreaseBetAmount('');
                  setShowIncreaseBetModal(true);
                }}
                onCashout={() => setShowCashoutConfirmation(true)}
                onResolveWager={() => setShowResolveModal(true)}
              />
            )}

            {/* Recent Participants */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Participants</h3>
              <div className="space-y-4 max-h-48 overflow-y-auto">
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div key={participant.id || index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          {participant.userName ? participant.userName[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {participant.userName || `User ${participant.userId?.substring(0, 6)}...`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Opted: <span className="font-medium">{participant.optionSelected}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          ₦{participant.wagerAmount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No participants yet</p>
                )}
              </div>
            </div>

            <div className='lg:hidden'>
              <CommentSection wagerId={actualWagerId || ''} />
            </div>
          </div>
        </div>
      </div>

      {/* All Modals remain the same */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
        onSuccess={handleAuthSuccess}
      />

      <BetConfirmationModal
        isOpen={showBetConfirmation}
        onClose={() => setShowBetConfirmation(false)}
        selectedOption={selectedOption}
        betAmount={betAmount}
        potentialReturn={potentialReturn}
        isPlacingBet={isPlacingBet}
        onConfirm={handlePlaceBet}
        wagerType={wager.wagerType ?? 'p2p'}
        oddsAtBet={oddsAtBet}
        platformFeeRate={platformFeeRate}
      />

      <IncreaseBetModal
        isOpen={showIncreaseBetModal}
        onClose={() => setShowIncreaseBetModal(false)}
        increaseBetAmount={increaseBetAmount}
        setIncreaseBetAmount={setIncreaseBetAmount}
        userParticipation={userParticipation}
        calculatePotentialWinIncrease={calculatePotentialWinIncrease}
        isIncreasing={isIncreasing}
        onConfirm={handleIncreaseBet}
      />

      <CashoutModal
        isOpen={showCashoutConfirmation}
        onClose={() => setShowCashoutConfirmation(false)}
        cashoutAmount={calculateCashoutAmount()}
        isCashingOut={isCashingOut}
        onConfirm={handleCashout}
      />

      <ResolveWagerModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        processedOptions={processedOptions}
        resolvingOption={resolvingOption}
        setResolvingOption={setResolvingOption}
        isResolving={isResolving}
        onConfirm={handleResolveWager}
      />
    </div>
  );
};

export default WagerDetails;