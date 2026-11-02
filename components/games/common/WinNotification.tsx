'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Check, AlertTriangle, X, DollarSign, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface WinNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  result: 'win' | 'lose' | 'forfeit' | 'opponentForfeit';
  amount: number;
  opponentName?: string;
  onPlayAgain?: () => void;
  onBrowseGames?: () => void;
  initiatorId?: string;
  currentUserId?: string;
}

const WinNotification: React.FC<WinNotificationProps> = ({
  isOpen,
  onClose,
  result,
  amount,
  opponentName = 'Opponent',
  onPlayAgain,
  onBrowseGames,
  initiatorId,
  currentUserId
}) => {
  // Trigger confetti animation on win
  useEffect(() => {
    if (isOpen && (result === 'win' || result === 'opponentForfeit')) {
      fireConfetti();
    }
  }, [isOpen, result]);

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#4338ca', '#6ee7b7', '#fcd34d'],
        zIndex: 9999,
      });
      
      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  };

  if (!isOpen) return null;

  const formatDisplayName = (name: string): string => {
    return name.replace(/^Player-/, '');
  };

  const displayName = formatDisplayName(opponentName);

  // Determine content based on result
  const getContent = () => {
    switch (result) {
      case 'win':
        return {
          icon: <Trophy className="w-16 h-16 text-yellow-300" />,
          title: "You won!",
          message: `Congratulations! You've won ₦${amount.toLocaleString()}.`,
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          iconBg: "bg-green-500/30",
          buttons: {
            primary: {
              text: "Play Again",
              icon: <RefreshCw className="w-4 h-4 mr-2" />,
              action: onPlayAgain
            },
            secondary: {
              text: "Browse Games",
              icon: <Home className="w-4 h-4 mr-2" />,
              action: onBrowseGames
            }
          }
        };
      case 'opponentForfeit':
        return {
          icon: <Trophy className="w-16 h-16 text-yellow-300" />,
          title: "Opponent Forfeited!",
          message: `${displayName} forfeited the game. You've been awarded ₦${amount.toLocaleString()}.`,
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          iconBg: "bg-green-500/30",
          buttons: {
            primary: {
              text: "Play Again",
              icon: <RefreshCw className="w-4 h-4 mr-2" />,
              action: onPlayAgain
            },
            secondary: {
              text: "Browse Games",
              icon: <Home className="w-4 h-4 mr-2" />,
              action: onBrowseGames
            }
          }
        };
      case 'lose':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-amber-400" />,
          title: "You lost",
          message: `Better luck next time. You've lost ₦${amount.toLocaleString()}.`,
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          iconBg: "bg-red-500/30",
          buttons: {
            primary: {
              text: "Try Again",
              icon: <RefreshCw className="w-4 h-4 mr-2" />,
              action: onPlayAgain
            },
            secondary: {
              text: "Browse Games",
              icon: <Home className="w-4 h-4 mr-2" />,
              action: onBrowseGames
            }
          }
        };
      case 'forfeit':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-amber-400" />,
          title: "You Forfeited",
          message: `You forfeited the game. ₦${amount.toLocaleString()} has been awarded to ${displayName}.`,
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          iconBg: "bg-red-500/30",
          buttons: {
            primary: {
              text: "Try Again",
              icon: <RefreshCw className="w-4 h-4 mr-2" />,
              action: onPlayAgain
            },
            secondary: {
              text: "Browse Games",
              icon: <Home className="w-4 h-4 mr-2" />,
              action: onBrowseGames
            }
          }
        };
      default:
        return {
          icon: <Check className="w-16 h-16 text-white" />,
          title: "Game Ended",
          message: "This game has ended.",
          bgColor: "bg-blue-500/20",
          borderColor: "border-blue-500/30",
          iconBg: "bg-blue-500/30",
          buttons: {
            primary: {
              text: "Play Again",
              icon: <RefreshCw className="w-4 h-4 mr-2" />,
              action: onPlayAgain
            },
            secondary: {
              text: "Browse Games",
              icon: <Home className="w-4 h-4 mr-2" />,
              action: onBrowseGames
            }
          }
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.3 
            }}
            className={cn(
              "bg-black/30 backdrop-blur-md rounded-xl border",
              "p-6 w-full max-w-md relative z-50 shadow-2xl",
              content.borderColor
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  content.iconBg
                )}
              >
                {content.icon}
              </motion.div>

              <div className="space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white"
                >
                  {content.title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80"
                >
                  {content.message}
                </motion.p>
                
                {/* Amount Box */}
                {(result === 'win' || result === 'opponentForfeit') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 bg-white/10 p-3 rounded-lg mx-auto max-w-[200px]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="text-green-300 w-5 h-5" />
                      <span className="text-xl font-bold text-white">₦{amount.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      Added to your balance
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex space-x-4 w-full pt-2"
              >
                {content.buttons.secondary.action && (
                  <button
                    onClick={content.buttons.secondary.action}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 
                            text-white font-medium rounded-lg transition-colors
                            flex items-center justify-center"
                  >
                    {content.buttons.secondary.icon}
                    {content.buttons.secondary.text}
                  </button>
                )}
                
                {content.buttons.primary.action && (
                  <button
                    onClick={content.buttons.primary.action}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-500 
                            hover:from-purple-700 hover:to-blue-600 text-white font-semibold 
                            rounded-lg transition-colors flex items-center justify-center"
                  >
                    {content.buttons.primary.icon}
                    {content.buttons.primary.text}
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WinNotification;