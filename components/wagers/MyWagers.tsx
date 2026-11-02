'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthModal from '@/components/auth/AuthModal';
import { useWagerQueries } from '@/hooks/useWagerHooks';

export default function MyWagers() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const user = session?.user || null;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ✅ Memoize query filter to avoid infinite reload
  const queryFilters = useMemo(
    () => (user?.id ? { creatorId: user.id } : undefined),
    [user?.id]
  );

  const {
    wagers,
    status: wagerStatus,
    error,
    refetch,
  } = useWagerQueries(queryFilters, { enabled: !!user?.id });

  // Derived states
  const isLoading = wagerStatus === 'loading';
  const hasError = wagerStatus === 'error';

  const visibleWagers = useMemo(
    () => (isExpanded ? wagers : wagers.slice(0, 2)),
    [isExpanded, wagers]
  );
  // --- Render Logic ---

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-60">
          <div className="flex flex-col items-center text-center">
            <Trophy className="h-12 w-12 text-purple-600/20 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Sign In Required
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Please sign in to view your wagers.
              </p>
              <Button onClick={() => setIsAuthModalOpen(true)} className="mt-4">
                Sign In
              </Button>
            </div>
          </div>
        </CardContent>
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode="login"
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            refetch(); // re-fetch wagers after auth success
          }}
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error?.message || 'Failed to fetch wagers'}</AlertDescription>
      </Alert>
    );
  }

  if (wagers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-60">
          <div className="flex flex-col items-center text-center">
            <Trophy className="h-12 w-12 text-purple-600/20 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                No Active Wagers
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Start your betting journey by exploring available wagers.
              </p>
              <Button onClick={() => router.push('/wagers')} className="mt-4">
                Explore Wagers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Wagers</h2>
          <p className="text-sm text-gray-500 mt-1">
            Managing {wagers.length} active prediction{wagers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-sm px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
          Total: {wagers.length}
        </span>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
        {visibleWagers.map((wager: any) => (
          <Card
            key={wager.id}
            className="bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 cursor-pointer"
            onClick={() => router.push(`/wagers/${wager.slug}`)}
          >
            <CardContent className="p-4">
              <div className="space-y-4">

                {/* Wager Details */}
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase">Title</p>
                    <p className="font-medium text-white">{wager.title || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase">Total Pool</p>
                    <p className="font-medium text-white">
                      {wager.totalPool ? `₦${wager.totalPool.toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3" /> Expires At
                    </p>
                    <p className="font-medium text-purple-400">
                      {wager.expiresAt ? `${new Date(wager.expiresAt).toLocaleDateString()}` : '—'}
                    </p>
                  </div>
                </div>

                {/* View Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/wagers/${wager.slug}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        ))}
      </div>

      {wagers.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-500 hover:text-gray-400"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" /> Show More Wagers
            </>
          )}
        </Button>
      )}
    </div>
  );
}
