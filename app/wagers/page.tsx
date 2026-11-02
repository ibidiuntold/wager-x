'use client';

import React, { useState } from 'react';
import WagersList from '@/components/wagers/WagerList';
import LayoutSelector from '@/components/common/LayoutSelector';
import WagerCreateButton from '@/components/wagers/WagerCreateButton';
import PopularWagersLeaderboard from '@/components/wagers/PopularWagersLeaderboard';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function WagersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <LayoutSelector layoutType="main">
      <div className="container mx-auto max-w-7xl px-4 py-8 mt-14">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Wagers
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Bet on event outcomes and invite friends to join
            </p>
          </div>
          <WagerCreateButton showText={true} />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar (Leaderboard) */}
          <div className="order-last lg:col-span-4 lg:order-last">
            <div className="sticky top-6 space-y-6">
              <PopularWagersLeaderboard filter="trending" />
            </div>
          </div>

          {/* Main Wagers Section */}
          <div className="lg:col-span-8 lg:order-first">
            {/* Mobile View Category Selector */}
            <div className="mb-6 block lg:hidden">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <SelectItem value="all">All Wagers</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Category Tabs */}
            <div className="mb-6 hidden lg:block">
              <div className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-1">
                {['all', 'sports', 'entertainment', 'politics', 'other'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-2 rounded-md font-medium transition-colors
                      ${selectedCategory === cat
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search wagers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <WagersList selectedCategory={selectedCategory} searchTerm={searchTerm} />
          </div>
        </div>
      </div>
    </LayoutSelector>
  );
}
