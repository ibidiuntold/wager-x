'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Wallet, Users, Trophy, Settings, Link2 } from 'lucide-react';

interface TransitionSkeletonProps {
  state: string;
  className?: string;
}

/**
 * Skeleton loader that adapts based on the current game state
 * Shows relevant placeholders for different context screens
 */
const TransitionSkeleton: React.FC<TransitionSkeletonProps> = ({
  state,
  className
}) => {
  // Helper for creating skeleton items
  const SkeletonItem = ({ className }: { className?: string }) => (
    <div className={cn("h-8 bg-slate-700/20 dark:bg-white/10 rounded-md animate-pulse", className)} />
  );

  // Render different skeletons based on the state
  const renderSkeleton = () => {
    switch (state) {
      case 'setting_wager':
      case 'creating_session':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-slate-400 dark:text-slate-400" />
              <SkeletonItem className="flex-grow" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <SkeletonItem />
              <SkeletonItem />
              <SkeletonItem />
            </div>
            <SkeletonItem className="h-12 w-full" />
          </div>
        );

      case 'waiting_for_opponent':
      case 'finding_random_opponent':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Link2 className="w-6 h-6 text-slate-400 dark:text-slate-400" />
              <SkeletonItem className="flex-grow" />
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-slate-400 dark:text-slate-400" />
              <SkeletonItem className="flex-grow" />
            </div>
            <SkeletonItem className="h-10 w-full" />
          </div>
        );

      case 'opponent_joined':
      case 'initializing_game':
        return (
          <div className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/20 dark:bg-white/10 animate-pulse flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400 dark:text-slate-400" />
            </div>
            <SkeletonItem className="w-3/4" />
            <SkeletonItem className="w-1/2" />
          </div>
        );

      case 'playing':
        return (
          <div className="space-y-6">
            <div className="h-40 bg-slate-700/20 dark:bg-white/10 rounded-md animate-pulse" />
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-slate-400 dark:text-slate-400" />
              <SkeletonItem className="flex-grow" />
            </div>
          </div>
        );

      case 'game_finished':
        return (
          <div className="space-y-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-700/20 dark:bg-white/10 animate-pulse flex items-center justify-center">
              <Trophy className="w-10 h-10 text-slate-400 dark:text-slate-400" />
            </div>
            <SkeletonItem className="w-3/4" />
            <div className="flex space-x-4 w-full">
              <SkeletonItem className="flex-1 h-12" />
              <SkeletonItem className="flex-1 h-12" />
            </div>
          </div>
        );

      default:
        // Generic skeleton for other states
        return (
          <div className="space-y-4">
            <SkeletonItem className="w-full" />
            <SkeletonItem className="w-3/4" />
            <SkeletonItem className="w-1/2" />
          </div>
        );
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {renderSkeleton()}
    </div>
  );
};

export default TransitionSkeleton;