'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWagerQueries } from '@/hooks/useWagerHooks';
import WagerPreviewModal from '../wagers/WagerPreviewModal';

export type Wager = {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
};

interface WagerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKeyword?: string;
  onRequireAuth: () => void;
}

const WagerSearchModal: React.FC<WagerSearchModalProps> = ({
  isOpen,
  onClose,
  initialKeyword = '',
  onRequireAuth
}) => {
  const [searchTerm, setSearchTerm] = useState(initialKeyword);
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);
  const [triggerSearch, setTriggerSearch] = useState(false);

  // Pass search term only when user clicks search
  const { wagers, status, refetch } = useWagerQueries(
    { limit: 10, wager_contains: triggerSearch ? searchTerm : undefined },
    { enabled: false } // disable auto fetch
  );

  const handleSearchClick = () => {
    setTriggerSearch(true);
    refetch();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setTriggerSearch(false);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setTriggerSearch(false);
  };

  const openWagerPreview = (wager: Wager) => {
    handleClose();
    setSelectedWager(wager);
  };

  const renderWagerList = () => {
    if (status === 'loading') {
      return (
        <div className="space-y-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm animate-pulse" />
          ))}
        </div>
      );
    }

    if (status === 'error') {
      return <p className="text-center text-red-500 mt-4">Failed to load wagers.</p>;
    }

    if (!wagers.length) {
      return <p className="text-center text-gray-500 mt-4">No wagers found.</p>;
    }

    return (
      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        {wagers.map((wager, index) => (
          <div
            key={`${wager.id}-${index}`}
            className="flex items-center space-x-4 mb-4 cursor-pointer"
            onClick={() => openWagerPreview(wager)}
          >
            <img
              src={wager.image}
              alt={wager.title}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <div>
              <h3 className="text-lg font-bold">{wager.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{wager.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="hide-close-button sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] bg-white dark:bg-gray-900 text-black dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-hidden">
          <DialogHeader className="relative">
            <DialogTitle className="text-2xl font-bold">Search Wagers</DialogTitle>
          </DialogHeader>

          {/* Search Input + Button */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <Button onClick={handleSearchClick} variant="default">
              Search
            </Button>
          </div>

          {/* Subheading & Button */}
          <div className="flex justify-between items-center mt-3">
            <h2 className="text-lg font-semibold">Recent Wagers</h2>
            <Button variant="outline" size="sm" onClick={() => console.log('Go to all wagers')}>
              See All
            </Button>
          </div>

          {/* Wager List */}
          {renderWagerList()}
        </DialogContent>
      </Dialog>

      {selectedWager && (
        <WagerPreviewModal
          isOpen={!!selectedWager}
          onClose={() => setSelectedWager(null)}
          onRequireAuth={onRequireAuth}
          wager={selectedWager}
        />
      )}
    </>
  );
};

export default WagerSearchModal;
