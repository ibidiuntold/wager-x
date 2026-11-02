'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';

interface WelcomeSuccessModalProps {
  nickname: string;
  avatarUrl: string;
  onClose: () => void;
}

const WelcomeSuccessModal: React.FC<WelcomeSuccessModalProps> = ({
  nickname,
  avatarUrl,
  onClose
}) => {
  // Convert avi-X.png to avi-X-good.png
  const celebrationAvatarUrl = avatarUrl.replace('.png', '-good.png');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6">
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <PartyPopper className="w-12 h-12 text-yellow-500" />
                </motion.div>
              </div>
              
              <div className="text-center mt-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4"
                >
                  <img
                    src={celebrationAvatarUrl}
                    alt="Welcome Avatar"
                    className="w-32 h-32 mx-auto rounded-full"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2 mb-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Welcome to WagerX!
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 p-1 bg-green-200 dark:bg-gray-800 border border-green-800 rounded-xl ">
                    Good to have you here <span className="font-semibold">{nickname}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your account has been created successfully. Get ready to experience thrilling bets and massive wins!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <Button
                    onClick={onClose}
                    className="w-full"
                  >
                    Start Exploring
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeSuccessModal;