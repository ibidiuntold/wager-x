'use client';

import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { computeTier } from './LeaderboardView';

interface LeaderboardRow {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  totalWinnings: number;
  wagersPlayed: number;
  gamePoints: number;
}

export default function LeaderboardWidget() {
  const [users, setUsers] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard?type=global&limit=5')
      .then(r => r.ok ? r.json() : { users: [] })
      .then(data => setUsers(data.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Players</h3>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Leaderboard coming soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => {
            const { label, colorClass } = computeTier(Number(user.gamePoints ?? 0));
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            return (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-base font-bold text-gray-500 dark:text-gray-400 shrink-0">
                  {rankEmoji}
                </span>
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.nickname ?? 'User'} className="h-8 w-8 object-cover rounded-full" />
                    : (user.nickname ?? 'U')[0].toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.nickname ?? 'Anonymous'}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${colorClass}`}>{label}</span>
                </div>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400 shrink-0">
                  ₦{Number(user.totalWinnings).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
