'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import {
  Rocket,
  Briefcase,
  Sparkles,
  Users,
  Volleyball,
  Swords,
  Gamepad2,
  Tv,
} from 'lucide-react';
import GameSearchModal from '../common/wager-search';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import path from 'path';

// No longer needed, but keeping for reference if future designs require them.
// type IconMap = {
//   [key: string]: React.ComponentType<{ className?: string }>;
// };

const BetOnEverything = () => {
  const { theme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalKeyword, setSearchModalKeyword] = useState('');

  const openAuthModal = (mode: 'login' | 'register') => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSearchModalOpen = (keyword = '') => {
    setSearchModalKeyword(keyword);
    setIsSearchModalOpen(true);
  };

  const handleSearchModalClose = () => {
    setIsSearchModalOpen(false);
    setSearchModalKeyword('');
  };

  const handleRequireAuth = () => {
    setIsSearchModalOpen(false); // Close the search modal
    openAuthModal('login'); // Open auth modal in login mode
  };

  const categoryCards = [
    {
      title: 'Sports & Esports',
      description: 'Football, basketball, tennis, esports tournaments, and more',
      tags: ['Premier League', 'NBA Finals', 'Wimbledon', 'LoL Worlds'],
      icon: <Volleyball className="w-12 h-12 text-white" />,
      iconBg: 'bg-blue-600',
      category: 'sports',
    },
    {
      title: 'Politics & Elections',
      description: 'Presidential races, debates, policy outcomes, and political events',
      tags: ['US Elections', 'Brexit outcomes', 'Debate winners'],
      icon: <Briefcase className="w-12 h-12 text-white" />,
      iconBg: 'bg-purple-600',
      category: 'politics',
    },
    {
      title: 'Entertainment',
      description: 'Award shows, reality TV, celebrity events, and pop culture',
      tags: ['Oscars', 'Big Brother', 'X-Factor', 'Celebrity outcomes'],
      icon: <Sparkles className="w-12 h-12 text-white" />,
      iconBg: 'bg-pink-600',
      category: 'entertainment',
    },
    {
      title: 'Games & Competitions',
      description: 'Snooker, chess tournaments, poker, and skill-based games',
      tags: ['World Snooker Championship', 'Chess Championships', 'Poker Series'],
      icon: <Gamepad2 className="w-12 h-12 text-white" />,
      iconBg: 'bg-green-600',
      category: 'games',
    },
    {
      title: 'TV & Media',
      description: 'Show outcomes, ratings predictions, and media events',
      tags: ['Surviving winner', 'Show ratings', 'Media awards'],
      icon: <Tv className="w-12 h-12 text-white" />,
      iconBg: 'bg-yellow-600',
      category: 'tv',
    },
    {
      title: 'Custom Wagers',
      description: 'Create your own bets on any event or challenge friends',
      tags: ['Weather bets', 'Personal challenges', 'Social media outcomes'],
      icon: <Users className="w-12 h-12 text-white" />,
      iconBg: 'bg-cyan-600',
      category: 'custom',
    },
  ];

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        initialMode={initialAuthMode}
        onClose={() => setShowAuthModal(false)}
      />
      {/* New Section: Category Cards */}
      <section className="px-2 py-8 md:px-4 lg:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Bet on Everything</h2>
          <p className="text-gray-400">Discover unlimited betting opportunities across all categories of events</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryCards.map((card, index) => (
            <Link
              href={{ pathname: '/wagers/create', query: { category: card.category } }}
              key={index}
              className="h-full w-full"
            >
              <motion.div
                className={cn(
                  "p-6 rounded-xl border shadow-md cursor-pointer transition-all duration-300",
                  "bg-white hover:bg-gray-100 border-gray-200 hover:shadow-lg", // light mode hover
                  "dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700", // dark mode hover
                  "h-full w-full flex flex-col" // ensures full height & width
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                whileHover={{ y: -8 }} // upward movement
              >
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-purple-500 to-blue-500 shadow-md">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {card.description}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-auto">
                    {card.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs text-purple-500 underline decoration-purple-400/50 underline-offset-4 cursor-pointer hover:text-purple-400 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default BetOnEverything;
