import React from 'react';
import WagerCard from './WagerCard';

interface Wager {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  expiresAt: string | Date;
  totalPool?: number;
  participantsCount?: number;
}

interface WagerGridProps {
  wagers: Wager[];
  onWagerClick: (slug: string) => void;
}

const WagerGrid: React.FC<WagerGridProps> = ({ wagers, onWagerClick }) => {
  return (
    <div className="grid gap-4">
      {wagers.map((wager) => (
        <WagerCard
          key={wager.id}
          wager={wager}
          onWagerClick={onWagerClick}
        />
      ))}
    </div>
  );
};

export default WagerGrid;