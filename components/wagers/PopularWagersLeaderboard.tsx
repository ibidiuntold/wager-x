'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Wager {
  id: string;
  slug: string;
  title: string;
  category: string;
  minimumEntry: number;
  participantsCount?: number;
  status: 'open' | 'closed' | 'expired' | 'active';
  createdAt: string | Date;
  expiresAt: string | Date;
  image?: string;
  options: Array<{ name: string; odds: number }>;
}

interface PopularWagersLeaderboardProps {
  className?: string;
  limit?: number;
  filter?: 'newest' | 'trending' | 'ending-soon' | 'largest-pool';
}

export default function PopularWagersLeaderboard({
  className,
  limit = 5,
  filter = 'trending',
}: PopularWagersLeaderboardProps) {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWagers = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit.toString());
        if (filter) {
          queryParams.append('sort', filter);
        }

        const res = await fetch(`/api/wagers?${queryParams.toString()}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch wagers');
        }

        const data = await res.json();
        const activeWagers: Wager[] = Array.isArray(data.wagers)
          ? data.wagers.filter(
              (w: Wager) => w.status === 'open' || w.status === 'active'
            )
          : [];

        setWagers(activeWagers);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch wagers due to a network error.');
      } finally {
        setLoading(false);
      }
    };

    fetchWagers();
  }, [limit, filter]);

  const handleWagerClick = (slug: string) => {
    router.push(`/wagers/${slug}`);
  };

  const getStatusBadge = (status: Wager['status']) => {
    let bgColor = 'bg-gray-500';
    let text = status;

    switch (status) {
      case 'open':
      case 'active':
        bgColor = 'bg-green-600';
        text = 'Active';
        break;
      case 'closed':
      case 'expired':
        bgColor = 'bg-red-600';
        text = 'Expired';
        break;
    }

    return (
      <span
        className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${bgColor}`}
      >
        {text}
      </span>
    );
  };

  return (
    <Card
      className={cn(
        'w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 shadow-lg text-gray-900 dark:text-white',
        className
      )}
    >
      <CardHeader className="pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <Flame className="h-5 w-5 text-orange-400 mr-2" />
            <span className="text-gray-900 dark:text-gray-200">Trending Wagers</span>
          </CardTitle>
          <Badge className="px-2 py-1 bg-purple-600 text-white text-sm rounded-full">
            {wagers.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-fit">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: limit }).map((_, i) => (
                <div
                  key={i}
          className="h-20 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[200px] text-red-400 p-4">
              {error}
            </div>
          ) : wagers.length === 0 ? (
            <div className="flex justify-center items-center h-[200px] text-gray-500 p-4">
              No trending wagers found
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {wagers.map((wager, index) => (
                <div
                  key={wager.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-300 dark:border-gray-800"
                  onClick={() => handleWagerClick(wager.slug)}
                >
                  <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-200 text-base leading-tight mb-1">
                      {wager.title}
                    </h4>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full capitalize">
                        {wager.category}
                      </span>
                      <span>₦{wager.minimumEntry.toLocaleString()}</span>
                      <span>{wager.participantsCount || 0} participants</span>
                      {getStatusBadge(wager.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
