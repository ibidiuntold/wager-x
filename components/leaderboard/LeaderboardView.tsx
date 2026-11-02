'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, Users, Calendar } from 'lucide-react';

// ── Pure helper functions ────────────────────────────────────────────────────

export type TierLabel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export function computeTier(gamePoints: number): {
  label: TierLabel;
  colorClass: string;
} {
  if (gamePoints >= 5000) return { label: 'Diamond',  colorClass: 'bg-cyan-500 text-white' };
  if (gamePoints >= 1000) return { label: 'Platinum', colorClass: 'bg-purple-500 text-white' };
  if (gamePoints >= 500)  return { label: 'Gold',     colorClass: 'bg-yellow-500 text-white' };
  if (gamePoints >= 100)  return { label: 'Silver',   colorClass: 'bg-gray-400 text-white' };
  return                          { label: 'Bronze',   colorClass: 'bg-orange-600 text-white' };
}

export function assignRanks<T extends { rankScore: number }>(
  users: T[]
): (T & { rank: number })[] {
  // users must be pre-sorted descending by rankScore
  let rank = 1;
  return users.map((user, index) => {
    if (index > 0 && user.rankScore < (users[index - 1] as any).rankScore) {
      rank = index + 1;
    }
    return { ...user, rank };
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface TierBadgeProps { gamePoints: number }
function TierBadge({ gamePoints }: TierBadgeProps) {
  const { label, colorClass } = computeTier(gamePoints);
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

interface LeaderboardRowProps {
  rank: number;
  user: any;
  isCurrentUser: boolean;
  activeTab: 'global' | 'weekly' | 'friends';
}
function LeaderboardRowItem({ rank, user, isCurrentUser, activeTab }: LeaderboardRowProps) {
  const earnings = activeTab === 'weekly'
    ? Number(user.weeklyWinnings ?? 0)
    : Number(user.totalWinnings ?? 0);
  const wagerStat = activeTab === 'weekly'
    ? Number(user.weeklyWagerCount ?? 0)
    : Number(user.wagersPlayed ?? 0);

  const rankDisplay = rank <= 3
    ? ['🥇', '🥈', '🥉'][rank - 1]
    : `#${rank}`;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
      isCurrentUser
        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`}>
      <span className="w-8 text-center text-lg font-bold text-gray-500 dark:text-gray-400 shrink-0">
        {rankDisplay}
      </span>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={user.avatarUrl ?? ''} alt={user.nickname ?? 'User'} />
        <AvatarFallback className="bg-purple-600 text-white text-sm">
          {(user.nickname ?? 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {user.nickname ?? 'Anonymous'}
            {isCurrentUser && <span className="text-purple-600 dark:text-purple-400 ml-1">(You)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <TierBadge gamePoints={Number(user.gamePoints ?? 0)} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{wagerStat} wagers</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">
          ₦{earnings.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {activeTab === 'weekly' ? 'this week' : 'total'}
        </p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type TabType = 'global' | 'weekly' | 'friends';

export default function LeaderboardView() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [users, setUsers]       = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setUsers([]);
    fetch(`/api/leaderboard?type=${activeTab}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setUsers(data.users ?? []);
        setIsEmpty(data.isEmpty ?? false);
      })
      .catch(() => { if (!cancelled) setUsers([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

  const rankedUsers = useMemo(() => {
    const scored = users.map(u => ({
      ...u,
      rankScore: activeTab === 'weekly'
        ? Number(u.weeklyWinnings ?? 0)
        : Number(u.totalWinnings ?? 0),
    }));
    return assignRanks(scored);
  }, [users, activeTab]);

  const selfId = (session?.user as any)?.id ?? null;
  const selfEntry = rankedUsers.find(u => u.id === selfId);
  const showPinned = selfEntry && selfEntry.rank > 50;

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      );
    }
    if (activeTab === 'weekly' && isEmpty) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No wagers resolved this week yet.</p>
          <p className="text-sm mt-1">Leaderboard resets every Monday at midnight WAT.</p>
        </div>
      );
    }
    if (activeTab === 'friends' && rankedUsers.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No friends yet.</p>
          <p className="text-sm mt-1">Add friends to see how you compare!</p>
        </div>
      );
    }
    if (rankedUsers.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No data yet.</p>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        {rankedUsers.map(user => (
          <LeaderboardRowItem
            key={user.id}
            rank={user.rank}
            user={user}
            isCurrentUser={user.id === selfId}
            activeTab={activeTab}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-20 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-7 w-7 text-yellow-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leaderboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabType)}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
          <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
        </TabsList>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
          <TabsContent value="global" className="mt-0">{renderList()}</TabsContent>
          <TabsContent value="weekly" className="mt-0">{renderList()}</TabsContent>
          <TabsContent value="friends" className="mt-0">{renderList()}</TabsContent>
        </div>
      </Tabs>

      {/* Pinned self-row when user is ranked outside top 50 */}
      {showPinned && selfEntry && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">Your position</p>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-700 p-2 shadow-sm">
            <LeaderboardRowItem
              rank={selfEntry.rank}
              user={selfEntry}
              isCurrentUser
              activeTab={activeTab}
            />
          </div>
        </div>
      )}
    </div>
  );
}
