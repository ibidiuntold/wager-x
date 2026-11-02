'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import { useSession } from 'next-auth/react';
import { isServer } from '@/lib/utils/isServer';
import { cn } from '@/lib/utils';

const CtaSection = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const openAuthModal = (mode: 'login' | 'register') => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleStartBetting = () => {
    if (isServer()) return;
    !isAuthenticated ? openAuthModal('login') : (window.location.href = '/wagers');
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        initialMode={initialAuthMode}
        onClose={() => setShowAuthModal(false)}
      />
      <section className="px-4 py-12 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <motion.div
          className={cn(
            "relative rounded-3xl border shadow-lg text-center overflow-hidden",
            "py-20 px-10 md:px-16 lg:px-20", // 🔹 increased padding
            "bg-white border-gray-200", // light mode
            "dark:bg-gray-900 dark:border-gray-800" // dark mode
          )}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Subtle background glow (changes with theme) */}
          <div
            className={cn(
              "absolute inset-0 z-0",
              "bg-gradient-to-br from-purple-100 via-blue-50 to-white opacity-40", // light
              "dark:from-purple-900 dark:via-gray-950 dark:to-blue-900 dark:opacity-50" // dark
            )}
          ></div>

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Start Betting?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
              Join thousands of users betting on everything from sports to politics.
              Your next big win is just one prediction away.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Button
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white transform transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                  onClick={() => window.location.href = '/profile'}
                >
                  View Profile
                </Button>
              ) : (
                <Button
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white transform transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                  onClick={() => openAuthModal('register')}
                >
                  Create an Account
                </Button>
              )}
              <Button
                variant="outline"
                className={cn(
                  "px-8 py-3 rounded-lg border-2 transform transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20",
                  "bg-gray-100 border-purple-500 text-gray-900 hover:bg-gray-200",
                  "dark:bg-gray-900 dark:border-purple-500 dark:hover:bg-gray-800 dark:text-white"
                )}
                onClick={handleStartBetting}
              >
                Browse Wagers
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default CtaSection;
