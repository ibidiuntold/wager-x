import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface WagerCardProps {
  wager: {
    id: string;
    slug: string;
    title: string;
    category: string;
    status: string;
    expiresAt: string | Date;
    totalPool?: number;
    participantsCount?: number;
    wagerType?: 'p2p' | 'event';
    options?: Array<{ name: string; odds?: number }> | string;
  };
  onWagerClick: (slug: string) => void;
}

const WagerCard: React.FC<WagerCardProps> = ({ wager, onWagerClick }) => {
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

  const handleWagerClick = (slug: string) => {
    onWagerClick(slug);
  };

  return (
    <motion.div
      key={wager.id}
      className={cn(
        'group relative p-5 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-md cursor-pointer transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg'
      )}
      whileHover={{ scale: 1.01 }}
      onClick={() => handleWagerClick(wager.slug)}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        {getStatusBadge(wager.status, wager.expiresAt)}
      </div>

      {/* Category Badge — pr-16 clears the absolute status badge in top-right */}
      <div className="pr-16">
        <span className="inline-block bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-2 uppercase">
          {wager.category}
        </span>
        {wager.wagerType === 'event' && (
          <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2 uppercase ml-1">
            EVENT
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {wager.title}
      </h3>

      {/* Details */}
      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <p>Pool</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400">₦{wager.totalPool?.toLocaleString() ?? '0'}</p>
        </div>
        <div>
          <p>Participants</p>
          <p className="font-semibold text-gray-900 dark:text-white">{wager.participantsCount || 0}</p>
        </div>
        <div>
          <p>Expires</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(wager.expiresAt)}</p>
        </div>
      </div>

      {/* Per-option odds pills for event wagers */}
      {wager.wagerType === 'event' && (() => {
        const opts: Array<{ name: string; odds?: number }> = (() => {
          try {
            const raw = wager.options;
            if (!raw) return [];
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch { return []; }
        })();
        return opts.length > 0 ? (
          <div className="flex gap-1 flex-wrap mt-2">
            {opts.map((opt, i) => (
              <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                {opt.name}: <strong>{opt.odds ?? '?'}x</strong>
              </span>
            ))}
          </div>
        ) : null;
      })()}

      {/* Join Button */}
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          className={cn(
            "border-purple-600 text-purple-600 transition-all duration-200",
            // Default state: outline with purple border and text
            "bg-transparent hover:bg-transparent",
            // Card hover state: filled purple background with white text
            "group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600"
          )}
          onClick={(e) => { e.stopPropagation(); handleWagerClick(wager.slug); }}
        >
          Join Wager
        </Button>
      </div>
    </motion.div>
  );
};

export default WagerCard;