'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWagerQueries } from '@/hooks/useWagerHooks';
import { motion } from 'framer-motion';
import WagerGrid from './WagerGrid';
import Pagination from '../common/Pagination';

interface WagerListProps {
  selectedCategory?: string;
  searchTerm?: string;
}

export default function WagerList({ selectedCategory = 'all', searchTerm = '' }: WagerListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 5; // 👈 choose how many per page
  const router = useRouter();

  const filters = useMemo(() => ({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as 'open' | 'closed') : undefined,
    sort: sortBy,
    pageNumber: currentPage,
    limit,
  }), [selectedCategory, selectedStatus, sortBy, currentPage]);

  const { wagers, status, pagination } = useWagerQueries(filters);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const totalPages = pagination?.totalPages || 1;
    const current = currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 3) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const processedWagers = useMemo(() => {
    let result = wagers;
    if (searchTerm) {
      result = result.filter((w: any) =>
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [searchTerm, wagers]);

  const handleWagerClick = (slug: string) => {
    router.push(`/wagers/${slug}`);
  };

  const formatDate = (dateInput: string | Date): string => {
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (wagerStatus: string, expiresAt: string | Date) => {
    const isExpired = new Date() > new Date(expiresAt);
    const displayStatus = isExpired ? 'Expired' : (wagerStatus === 'open' ? 'Active' : wagerStatus);

    const bgMap: Record<string, string> = {
      active: 'bg-green-600',
      closed: 'bg-red-600',
      expired: 'bg-red-600',
      pending: 'bg-orange-600',
    };

    return (
      <span
        className={cn(
          'px-2 py-0.5 text-xs font-bold text-white rounded-full capitalize',
          bgMap[displayStatus.toLowerCase()] || 'bg-gray-500'
        )}
      >
        {displayStatus}
      </span>
    );
  };

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[140px] bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            <SelectValue placeholder="Sort by Latest" />
          </SelectTrigger>
          <SelectContent className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {processedWagers.length === 0 && (
        <Card className="p-8 text-center bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <Trophy className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Wagers Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try different filters or check back later.
            </p>
          </div>
        </Card>
      )}

      {/* Wager list */}
      <WagerGrid 
        wagers={processedWagers} 
        onWagerClick={handleWagerClick} 
      />

      {/* Pagination */}
      {wagers.length > 0 && pagination && (
        <Pagination
          currentPage={pagination?.page || currentPage}
          totalPages={pagination?.totalPages || 1}
          totalItems={pagination?.totalItems || 0}
          onPageChange={handlePageChange}
          showInfo={true}
        />
      )}
    </div>
  );
}