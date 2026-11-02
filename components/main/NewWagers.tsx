'use client';

import React, { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SectionTitle from '@/components/common/SectionTitle';
import { useWagerQueries } from '@/hooks/useWagerHooks';
import { Button } from '@/components/ui/button';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp } from 'lucide-react';

export default function NewWagers() {
  const router = useRouter();
  const [listedWagers, setListedWagers] = useState<number>(6);

  // ✅ memoize filters so it's stable across renders
  const filters = useMemo(
    () => ({ limit: listedWagers, status: 'open' }),
    []
  );

  const { wagers, status, refetch } = useWagerQueries(filters);

  const renderLoadingSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(listedWagers)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );

  return (
    <section className="py-8" aria-labelledby="hot-wagers-title">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle title="Hot Wagers 🔥" />
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              className="px-0 text-gray-400 hover:text-white transition-colors"
              onClick={() => router.push('/wagers')}
            >
              View All Wagers
            </Button>
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="icon"
              aria-label="Reload wagers"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {status === 'loading' ? (
          renderLoadingSkeletons()
        ) : !wagers || wagers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No wagers available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wagers.map((wager: any) => (
              <div
                key={wager.id}
                onClick={() => router.push(`/wagers/${wager.slug}`)}
                className={cn(
                  "p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm cursor-pointer transition-colors duration-200 relative",
                  "hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${wager.status === 'closed' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {wager.status}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-lg">{wager.title}</h3>
                  <p className="text-sm text-gray-500">Category: {wager.category}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Pool: ₦{wager.totalPool?.toLocaleString() ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Options: {Array.isArray(wager.options) ? wager.options.length : 0}
                      </span>
                    </div>
                    <Button variant="link" className="p-0 h-auto text-gray-500 dark:text-gray-400">
                      Join Wager <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}