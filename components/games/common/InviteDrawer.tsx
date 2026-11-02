'use client';

import React, { useState, useEffect } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { SquareArrowUpRight, Link2, Copy, ChevronDown, ChevronUp, Wallet, MoveLeft, Info, Clock, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { OpponentData } from '@/types/game.types';
import BackdropPanel from '@/components/games/ui/BackdropPanel';
import { useSession } from 'next-auth/react';
interface InviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  gameName: string;
  wagerAmount: number; 
  sessionId?: string;
  onInviteWithId: (friendId: string, opponent: OpponentData) => void;
  onStartRandom: () => void;
  className?: string; 
}

// Increased to 15 minutes to give users enough time to sign up/log in
const INVITE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

const InviteDrawer: React.FC<InviteDrawerProps> = ({ 
  isOpen, 
  onClose, 
  gameSlug,
  gameName,
  wagerAmount, 
  sessionId, 
  onInviteWithId,
  onStartRandom,
  className
}) => {
  const [friendId, setFriendId] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [inviteStartTime, setInviteStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getUserReferralCode } = useReferral();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        setIsLoading(true);
        const code = await getUserReferralCode();
        setReferralCode(code);
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      fetchReferralCode();
    }
  }, [getUserReferralCode, isOpen]);

  // Track invite expiration time
  useEffect(() => {
    if (sessionId && !inviteStartTime) {
      setInviteStartTime(Date.now());
    }

    if (!sessionId) {
      setInviteStartTime(null);
      setTimeLeft(null);
      return;
    }

    if (inviteStartTime) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - inviteStartTime;
        const remaining = INVITE_EXPIRY - elapsed;
        
        if (remaining <= 0) {
          clearInterval(timer);
          setTimeLeft(0);
          toast({
            title: "Invite Expired",
            description: "Your game invite has expired. Please create a new one.",
            variant: "destructive"
          });
          // Auto-close on expiry
          onClose();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [sessionId, inviteStartTime, toast, onClose]);

  // Reset state when drawer is opened/closed
  useEffect(() => {
    if (isOpen) {
      setFriendId('');
      setShowLinkInput(false);
      setIsExpanded(true);
    }
  }, [isOpen]);

  const formatTimeLeft = () => {
    if (timeLeft === null) return '';
    const totalSeconds = Math.ceil(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId.trim()) {
      console.log('[InviteDrawer] Friend ID missing');
      toast({
        title: "Error",
        description: "Please enter a friend's ID",
        variant: "destructive"
      });
      return;
    }

    const friendIdTrimmed = friendId.trim();
    console.log('[InviteDrawer] Inviting friend by ID:', friendIdTrimmed);
    
    // Create opponent data using current user's info
    const opponent: OpponentData = {
      id: friendIdTrimmed,
      name: session?.user?.name || `Player-${friendIdTrimmed.substring(0, 6)}`,
      avatar: session?.user?.image || `/images/avatars/default.png`,
      wager: wagerAmount,
      isBot: false
    };

    onInviteWithId(friendIdTrimmed, opponent);
    setFriendId('');
    setShowLinkInput(true); // Show link after inviting
  };

  const generateInviteLink = (sessionId: string) => {
    const link = `${window.location.origin}/invite/${sessionId}`;
    console.log('[InviteDrawer] Generated game invite link:', link);
    return link;
  };

  const generateReferralLink = () => {
    if (!referralCode) return null;
    const link = `${window.location.origin}/ref/${referralCode}`;
    console.log('[InviteDrawer] Generated referral link:', link);
    return link;
  };

  const handleCopyLink = async () => {
    if (!sessionId && !referralCode) {
      console.log('[InviteDrawer] No session ID or referral code available for copying');
      toast({
        title: "Error",
        description: "Unable to generate invite link",
        variant: "destructive"
      });
      return;
    }

    const inviteLink = sessionId ? generateInviteLink(sessionId) : generateReferralLink();
    if (!inviteLink) {
      console.log('[InviteDrawer] Failed to generate invite link');
      toast({
        title: "Error",
        description: "Unable to generate invite link",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      console.log('[InviteDrawer] Link copied to clipboard');
      toast({
        title: "Success",
        description: "✅ Invite link copied to clipboard!",
      });
    } catch (err) {
      console.error('[InviteDrawer] Error copying to clipboard:', err);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!sessionId && !referralCode) {
      console.log('[InviteDrawer] No session ID or referral code available for sharing');
      toast({
        title: "Error",
        description: "Unable to generate invite link",
        variant: "destructive"
      });
      return;
    }

    const inviteLink = sessionId ? generateInviteLink(sessionId) : generateReferralLink();
    if (!inviteLink) {
      console.log('[InviteDrawer] Failed to generate invite link');
      toast({
        title: "Error",
        description: "Unable to generate invite link",
        variant: "destructive"
      });
      return;
    }

    if (navigator.share) {
      try {
        console.log('[InviteDrawer] Attempting native share...');
        const shareData = sessionId ? {
          title: `${gameName} Wager Invite`,
          text: `Join me for a friendly wager of ₦${wagerAmount.toLocaleString()} in ${gameName} 🎮`,
          url: inviteLink
        } : {
          title: 'Join WagerX',
          text: 'Join me on WagerX and start playing exciting games! 🎮',
          url: inviteLink
        };
        await navigator.share(shareData);
        console.log('[InviteDrawer] Native share successful');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[InviteDrawer] Share cancelled by user');
          return;
        }
        console.error('[InviteDrawer] Native share failed:', err);
        toast({
          title: "Error",
          description: "Failed to share. Please try copying the link instead.",
          variant: "destructive"
        });
      }
    } else {
      // Fallback for browsers that don't support native share
      handleCopyLink();
    }
  };

  // Animation variants
  const drawerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  };

  // Skeleton loader for loading state
  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="bg-white/10 h-10 rounded-lg animate-pulse"></div>
      <div className="bg-white/10 h-10 rounded-lg animate-pulse"></div>
      <div className="bg-white/10 h-10 rounded-lg animate-pulse"></div>
      <div className="bg-white/10 h-4 w-3/4 rounded animate-pulse"></div>
    </div>
  );

  // Content based on state
  const renderContent = () => {
    if (isLoading) {
      return renderSkeleton();
    }
    
    if (showLinkInput) {
      return (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Share Invite Link</span>
              {timeLeft !== null && (
                <span className="text-white/60 text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Expires in {formatTimeLeft()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
              <Link2 className="w-4 h-4 text-white/70 shrink-0" />
              <div className="text-white/70 text-sm truncate flex-grow max-w-[180px]">
                {sessionId ? generateInviteLink(sessionId) : 'Generating invite link...'}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors shrink-0"
                  aria-label="Copy link"
                >
                  <Copy className="text-white w-4 h-4" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors shrink-0"
                  aria-label="Share"
                >
                  <Share2 className="text-white w-4 h-4" />
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowLinkInput(false)}
              className="w-full py-2 px-3 bg-white/10 flex items-center justify-center hover:bg-white/20 rounded-lg text-white text-sm transition-colors mt-2"
            >
              <MoveLeft className="w-4 h-4 mr-2" />
              Back to ID Input
            </button>
          </div>
          
          {timeLeft === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/20 text-yellow-200 p-2 rounded-lg text-sm"
            >
              This invite has expired. Please create a new one.
            </motion.div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
            <Wallet className="w-4 h-4 text-white/70" />
            <input
              type="text"
              value={friendId}
              onChange={(e) => setFriendId(e.target.value.toUpperCase())}
              placeholder="ENTER FRIEND'S ID"
              className="bg-transparent text-white text-sm flex-grow outline-none placeholder:text-white/50"
            />
            <button 
              type="submit"
              className={cn(
                "p-1 hover:bg-white/10 rounded transition-colors",
                friendId.trim() ? "text-white" : "text-white/30"
              )}
              disabled={!friendId.trim()}
            >
              <SquareArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            type="button"
            onClick={() => setShowLinkInput(true)}
            className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Share Invite Link
          </button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  type="button"
                  onClick={onStartRandom}
                  className="disabled:opacity-50 w-full py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  Play with Random Opponent
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Find a random opponent to play with</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </form>
        
        <div className="text-white/50 text-xs">
          Invite a friend to play with a wager of ₦{wagerAmount.toLocaleString()}
        </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="flex flex-col items-center justify-center w-full">
          <BackdropPanel className="max-w-md w-full p-6 bg-slate-700/80 dark:bg-black/50">
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white/70 hover:text-white flex items-center gap-1"
                >
                  <span className="text-sm">Invite Friend</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button 
                  onClick={onClose}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded-full transition-colors"
                >
                  Cancel
                </button>
              </div>

              {isExpanded && (
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              )}
            </motion.div>
          </BackdropPanel>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteDrawer;