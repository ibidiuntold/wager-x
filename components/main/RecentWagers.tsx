'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { formatBalance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SectionTitle from '@/components/common/SectionTitle';

// Define a type for the wager object for better type safety
interface Wager {
  id: string;
  slug: string;
  title: string;
  totalPool: number;
  status: 'open' | 'cancelled' | 'completed' | 'closed';
  createdAt: string; // Assuming createdAt is a string date
}

export default function RecentWagers() {
  const router = useRouter();
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWagers = async () => {
      try {
        // Assuming the API can provide a limited number of recent wagers
        const res = await fetch('/api/wagers?limit=5');
        if (res.ok) {
          const data = await res.json();
          setWagers(data.wagers || []);
        } else {
          setError('Failed to fetch wagers');
        }
      } catch (err) {
        setError('An error occurred while fetching wagers.');
      } finally {
        setLoading(false);
      }
    };
    fetchWagers();
  }, []);

  const renderLoadingSkeletons = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionTitle title="Hot Wagers 🔥" />
        <Button variant="outline" size="sm" onClick={() => router.push('/wagers')}>
          View All
        </Button>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                </div>
                <div className="text-right">
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading || error || wagers.length === 0) {
    return renderLoadingSkeletons();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionTitle title="Hot Wagers 🔥" />
        <Button variant="outline" size="sm" onClick={() => router.push('/wagers')}>
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {wagers.map((wager) => (
          <div
            key={wager.id}
            onClick={() => router.push(`/wagers/${wager.slug}`)}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {wager.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pool Size: ₦{formatBalance(wager.totalPool)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    wager.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
                    wager.status === 'open' ? 'bg-green-100 text-green-800' :
                    wager.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {wager.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(wager.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}