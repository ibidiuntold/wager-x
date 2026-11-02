'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AvatarStepProps {
  onComplete: (avatarUrl: string) => void;
  onBack: () => void;
}

const AvatarStep: React.FC<AvatarStepProps> = ({ onComplete, onBack }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const totalAvatars = 12;

  const handleConfirm = async () => {
    if (!selectedAvatar) return;
    
    setIsLoading(true);
    try {
      const avatarUrl = `/images/avatar/avi-${selectedAvatar}.png`;
      await onComplete(avatarUrl);
    } catch (error) {
      console.error('Error setting avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Select an avatar that represents you
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 p-2">
        {Array.from({ length: totalAvatars }, (_, i) => i + 1).map((num) => (
          <motion.button
            key={`avatar-${num}`}
            onClick={() => setSelectedAvatar(num)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all
              ${selectedAvatar === num 
                ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' 
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }
            `}
          >
            <img
              src={`/images/avatar/avi-${num}.png`}
              alt={`Avatar ${num}`}
              className="w-full h-full object-cover transform transition-transform"
            />
            {selectedAvatar === num && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-purple-500/20 dark:bg-purple-500/30"
              />
            )}
          </motion.button>
        ))}
      </div>

      <div className="space-y-4 px-4">
        <Button
          onClick={handleConfirm}
          disabled={!selectedAvatar || isLoading}
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
              Setting Avatar...
            </>
          ) : (
            'Continue with Selected Avatar'
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="w-full bg-gradient-to-tr from-purple-500 to-purple-800"
        >
          Go Back
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 px-4">
        Don't worry, you can change your avatar later from your profile settings
      </p>
    </motion.div>
  );
};

export default AvatarStep;