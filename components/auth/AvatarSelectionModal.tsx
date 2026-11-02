'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarCarousel from './AvatarCarousel';
import { Button } from '@/components/ui/button';

interface AvatarSelectionModalProps {
  onComplete: (avatarUrl: string) => void;
}

  const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({ onComplete }) => {
    const [selectedAvatar, setSelectedAvatar] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
      setIsLoading(true);
      try {
        const avatarUrl = `/images/avatar/avi-${selectedAvatar}.png`;
        await onComplete(avatarUrl);
      } catch (error) {
        console.error('Error updating avatar:', error);
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Choose Your Avatar
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select an avatar to personalize your profile
            </p>

            <AvatarCarousel
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
            />

            <div className="mt-8">
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Setting up...
                  </>
                ) : (
                  'Choose Avatar'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarSelectionModal;