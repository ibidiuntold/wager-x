'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, updateDoc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { cacheService } from '@/services/cacheService';
import { useToast } from "@/components/ui/use-toast";
import { SearchBar, TableLoadingState } from "@/components/admin/common/AdminDashboardComponents";
import { DashboardCard } from "@/components/admin/common/AdminDashboardComponents";

interface Game {
  id: string;
  name: string;
  minBet: number;
  maxBet: number;
  isActive: boolean;
  maxPlayers: number;
  description: string;
  playCount?: number;
  totalBets?: number;
}

interface GameStats {
  mostPopularGame: string;
  totalGamesPlayed: number;
  averageBetSize: number;
}

// Cache keys
const GAMES_CACHE_KEY = 'admin_games';
const GAMES_STATS_CACHE_KEY = 'admin_games_stats';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function GameManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<GameStats>({
    mostPopularGame: '-',
    totalGamesPlayed: 0,
    averageBetSize: 0
  });
  const { toast } = useToast();
  // Remove: const firestore = useFirestore();

  const fetchGames = async (search = '') => {
    try {
      setError(null);
      
      // Check for cached data
      if (!search) {
        const cachedGames = cacheService.get<{games: Game[], stats: GameStats}>(
          GAMES_CACHE_KEY,
          CACHE_DURATION
        );
        
        if (cachedGames) {
          setGames(cachedGames.games);
          setStats(cachedGames.stats);
          setLoading(false);
          return;
        }
      }
      
      // Mark as loading and pending
      setLoading(true);
      
      // Check if request is already pending
      if (cacheService.isPending(GAMES_CACHE_KEY)) {
        return;
      }
      cacheService.setPending(GAMES_CACHE_KEY);
      
      // Fetch games
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      } else {
        setError('Failed to fetch games');
      }

      // Fetch game statistics
      const statsRes = await fetch('/api/game_sessions');
      if (statsRes.ok) {
        const data = await statsRes.json();
        const gameStats = data.reduce((acc: any, doc: any) => {
        acc.totalGamesPlayed++;
          acc.totalBets = (acc.totalBets || 0) + (doc.betAmount || 0);
        return acc;
      }, { totalGamesPlayed: 0, totalBets: 0 });

      // Find most popular game
        const gameCounts = data.reduce((acc: any, doc: any) => {
          const gameId = doc.gameId;
        acc[gameId] = (acc[gameId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostPlayedGameId = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      let mostPopularGameName = '-';
      
      if (mostPlayedGameId) {
          const gameDocRes = await fetch(`/api/games/${mostPlayedGameId}`);
          if (gameDocRes.ok) {
            const gameDoc = await gameDocRes.json();
            mostPopularGameName = gameDoc.name;
        }
      }

      const statsData = {
        mostPopularGame: mostPopularGameName,
        totalGamesPlayed: gameStats.totalGamesPlayed,
        averageBetSize: gameStats.totalGamesPlayed > 0 ? 
          gameStats.totalBets / gameStats.totalGamesPlayed : 0
      };
      
      setStats(statsData);
      } else {
        setError('Failed to fetch game statistics');
      }
      
      // Cache the results
      if (!search) {
        cacheService.set(GAMES_CACHE_KEY, {
          games: games,
          stats: statsData
        });
      }

    } catch (err) {
      setError('Failed to fetch games data. Please try again.');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
      cacheService.clearPending(GAMES_CACHE_KEY);
    }
  };

  // Handle initial data load
  useEffect(() => {
    fetchGames();
    
    return () => {
      cacheService.clearPending(GAMES_CACHE_KEY);
    };
  }, [fetchGames]);

  // Game status toggle
  const handleGameStatusChange = async (gameId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (res.ok) {
        const updatedGame = await res.json();
      setGames(prev => prev.map(game => 
        game.id === gameId 
            ? { ...game, isActive: updatedGame.isActive }
          : game
      ));
      
      // Invalidate cache
      cacheService.remove(GAMES_CACHE_KEY);

      toast({
        title: "Success",
        description: `Game ${isActive ? 'activated' : 'deactivated'} successfully`,
        variant: "default",
      });
      } else {
        toast({
          title: "Error",
          description: "Failed to update game status",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update game status",
        variant: "destructive",
      });
    }
  };

  // Game settings editor
  const handleGameSettingsUpdate = async (gameId: string) => {
    toast({
      title: "Info",
      description: "Game settings editor coming soon",
      variant: "default",
    });
  };
  
  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    // Filter games locally based on search term
    if (term) {
      const filteredGames = games.filter(game => 
        game.name.toLowerCase().includes(term.toLowerCase())
      );
      setGames(filteredGames);
    } else {
      // If search is cleared, fetch all games again
      fetchGames();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-md dark:bg-gray-800/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold dark:text-white">Game Management</CardTitle>
          <Button className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
            Add New Game
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search games..."
              width="w-full max-w-xs"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-400">Game Name</TableHead>
                  <TableHead className="dark:text-gray-400">Min Bet</TableHead>
                  <TableHead className="dark:text-gray-400">Max Bet</TableHead>
                  <TableHead className="dark:text-gray-400">Max Players</TableHead>
                  <TableHead className="dark:text-gray-400">Status</TableHead>
                  <TableHead className="dark:text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableLoadingState columns={6} rows={3} />
                ) : (
                  games.map((game) => (
                    <TableRow key={game.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{game.name}</TableCell>
                      <TableCell className="dark:text-gray-300">₦{game.minBet.toFixed(2)}</TableCell>
                      <TableCell className="dark:text-gray-300">₦{game.maxBet.toFixed(2)}</TableCell>
                      <TableCell className="dark:text-gray-300">{game.maxPlayers}</TableCell>
                      <TableCell>
                        <Switch
                          checked={game.isActive}
                          onCheckedChange={(checked) => handleGameStatusChange(game.id, checked)}
                          className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-400"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGameSettingsUpdate(game.id)}
                            className="dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => handleGameSettingsUpdate(game.id)}
                          >
                            View Stats
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Game Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Most Popular Game</h3>
              <p className="text-2xl font-bold dark:text-white">{stats.mostPopularGame}</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Total Games Played</h3>
              <p className="text-2xl font-bold dark:text-white">{stats.totalGamesPlayed.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Average Bet Size</h3>
              <p className="text-2xl font-bold dark:text-white">₦{stats.averageBetSize.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}