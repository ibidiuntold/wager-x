'use client';

import React, { useState, memo, useEffect } from 'react';
import { Heart, StepForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GamePreviewModal from '@/components/common/GamePreview'; 
import GameSearchModal from '@/components/common/wager-search';
import SectionTitle from '@/components/common/SectionTitle';
import { useGameQueries } from '@/hooks/useGameQueries';
// Remove: import { useFirestoreConnection } from '@/hooks/useFirestore';
import type { Game } from '@/types/game.types';

// Using the same type as Game since they should be identical
import type { Game as GamePreview } from '@/types/game.types';

interface TopGamesProps {
  onRequireAuth: () => void;
}

// Memoized card component to prevent unnecessary re-renders
const TopGameCard = memo(({ game, onClick }: { game: Game; onClick: () => void }) => (
  <div className="rounded-xl overflow-hidden bg-gradient-to-b from-white/50 to-gray-200/50 dark:from-gray-900/50 dark:to-gray-800/50 p-8 relative">
    <div 
      className="relative group aspect-square cursor-pointer overflow-hidden rounded-lg" 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
    >
      <img 
        src={game.image || '/images/topgames-loader.jpg'} 
        alt={game.title} 
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Heart 
          className="text-white opacity-70 hover:opacity-100 transition-opacity absolute top-2 right-2" 
          size={20}
          aria-label="Add to favorites"
        />
        <img 
          src="/game-assets/play.svg" 
          alt="Play Game" 
          className="w-12 h-12"
        />
      </div>
    </div>
    <div className="pt-2 text-center">
      <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-1">{game.title}</h3>
      <p className="text-purple-600 dark:text-purple-400 font-bold">
        {(game.monthPlayers || 0).toLocaleString()} players
      </p>
      <p className="text-xs text-gray-700 dark:text-gray-200">top rate for the day</p>
    </div>
    <img 
      src="/game-assets/horizontal-line-glow-dark.png"
      alt=""
      className="absolute bottom-0 left-0 w-full h-1 dark:block hidden"
    />
    <img 
      src="/game-assets/horizontal-line-glow-light.png"
      alt=""
      className="absolute bottom-0 left-0 w-full h-1 dark:hidden block"
    />
  </div>
));

TopGameCard.displayName = 'TopGameCard';

// Memoized loading skeleton component with realistic structures matching the actual card
const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="rounded-xl overflow-hidden bg-gradient-to-b from-white/50 to-gray-200/50 dark:from-gray-900/50 dark:to-gray-800/50 p-8 relative">
        <div className="aspect-square rounded-lg overflow-hidden relative">
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        </div>
        <div className="pt-2 text-center">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto mb-1 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-1 animate-pulse" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto animate-pulse" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700" />
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default function TopGames() {
  // Remove: const { isConnected, checkConnection } = useFirestoreConnection();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/games');
        if (res.ok) {
          const data = await res.json();
          setGames(data.games || []);
        } else {
          setError('Failed to fetch games');
        }
      } catch (err) {
        setError('Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  if (loading) return <div>Loading top games...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Top Games</h2>
      <ul>
        {games.map((game: any) => (
          <li key={game.id}>{game.title || game.name}</li>
        ))}
      </ul>
    </div>
  );
}