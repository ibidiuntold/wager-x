'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import type { Game } from '@/types/game.types';

interface GamePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
  game: Game;
}

const GamePreviewModal: React.FC<GamePreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onRequireAuth,
  game 
}) => {
  const { status, data: session } = useSession();
  const router = useRouter();
  
  // Add loading states
  const [isPlayLoading, setIsPlayLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const handlePlayClick = async () => {
    if (!session?.user) {
      onRequireAuth();
      setTimeout(() => onClose(), 0);
      return;
    }
    
    // Start loading state
    setIsPlayLoading(true);
    
    try {
      // Optional: Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(game.link);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset loading state
      setIsPlayLoading(false);
    }
  };

  const handleFavorites = async () => {
    if (!session?.user) {
      onRequireAuth();
      setTimeout(() => onClose(), 0);
      return;
    }
    
    // Start loading state
    setIsFavoriteLoading(true);
    
    try {
      // Implement add to favorites functionality
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulated async operation
      // Add actual favorite logic here
    } catch (error) {
      console.error('Favorite error:', error);
    } finally {
      // Reset loading state
      setIsFavoriteLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[250px] md:max-w-[300px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold text-center mb-2">Play</DialogTitle>
          <DialogDescription className="sr-only">
            Preview and play {game.title}. {game.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(128,0,128,0.3)]">
            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold mt-3 text-center">{game.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm text-center line-clamp-2">{game.description}</p>
          <div className="w-full mt-4 space-y-2">
            <Button 
              onClick={handlePlayClick}
              disabled={isPlayLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-base font-semibold"
            >
              {isPlayLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</>
              ) : (
                'Play'
              )}
            </Button>
            <Button 
              onClick={handleFavorites} 
              disabled={isFavoriteLoading}
              variant="outline" 
              className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-2 rounded-lg text-base font-semibold flex items-center justify-center"
            >
              {isFavoriteLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Heart className="mr-2" size={18} />
              )}
              To favorites
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GamePreviewModal;