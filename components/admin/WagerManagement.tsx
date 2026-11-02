'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { doc, updateDoc, collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { cacheService } from '@/services/cacheService';
import { useToast } from "@/components/ui/use-toast";
import { SearchBar, TableLoadingState } from "@/components/admin/common/AdminDashboardComponents";
import AddWagerModal from './AddWagerModal';
import { Eye, EyeOff, Trash2, Edit } from 'lucide-react';

interface Wager {
  id: string;
  gameName: string;
  amount: number;
  status: 'open' | 'closed' | 'cancelled';
  players: number;
  createdAt: string;
  isActive: boolean;
  gameId: string;
  creatorId: string;
  isPublic: boolean;
}

interface WagerStats {
  totalActive: number;
  totalValue: number;
  averageSize: number;
  publicWagers: number;
  privateWagers: number;
}

// Cache keys
const WAGERS_CACHE_KEY = 'admin_wagers';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function WagerManagement() {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stats, setStats] = useState<WagerStats>({
    totalActive: 0,
    totalValue: 0,
    averageSize: 0,
    publicWagers: 0,
    privateWagers: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchWagers = async (search = '') => {
      try {
        // Check cache only for non-search requests
        if (!search) {
          const cacheKey = WAGERS_CACHE_KEY;
          
          // Check if already fetching
          if (cacheService.isPending(cacheKey)) {
            return;
          }
          
          // Check cache first
          const cachedData = cacheService.get<{wagers: Wager[], stats: WagerStats}>(
            cacheKey,
            CACHE_DURATION
          );
          
          if (cachedData) {
            setWagers(cachedData.wagers);
            setStats(cachedData.stats);
            setLoading(false);
            return;
          }
          
          // Mark as pending
          cacheService.setPending(cacheKey);
        }
        
        setError(null);
        setLoading(true);
        
        // Build query based on search term
        let wagerQuery = query(
          collection(firestore, 'wagers'),
          orderBy('createdAt', 'desc')
        );

        if (search) {
          wagerQuery = query(
            collection(firestore, 'wagers'),
            where('gameName', '>=', search),
            where('gameName', '<=', search + '\uf8ff'),
            orderBy('gameName'),
            orderBy('createdAt', 'desc')
          );
        }

        // Execute query
        const querySnapshot = await getDocs(wagerQuery);
        const wagersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          let createdAtString: string;
          
          // Handle different timestamp formats
          if (data.createdAt instanceof Timestamp) {
            createdAtString = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtString = data.createdAt;
          } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAtString = data.createdAt.toDate().toISOString();
          } else {
            createdAtString = new Date().toISOString();
          }
          
          return {
            id: doc.id,
            ...data,
            createdAt: createdAtString,
            isPrivate: data.isPrivate !== undefined ? data.isPrivate : true // Default to private if undefined
          } as Wager;
        });

        // Update state
        setWagers(wagersData);

        // Calculate statistics
        const activeWagers = wagersData.filter(w => w.isActive);
        const publicWagers = wagersData.filter(w => !w.isPrivate).length;
        const privateWagers = wagersData.filter(w => w.isPrivate).length;
        const totalValue = wagersData.reduce((sum, wager) => sum + wager.amount, 0);
        const statsData = {
          totalActive: activeWagers.length,
          totalValue,
          averageSize: wagersData.length > 0 ? totalValue / wagersData.length : 0,
          publicWagers,
          privateWagers
        };
        
        setStats(statsData);
        
        // Cache the results for non-search requests
        if (!search) {
          cacheService.set(WAGERS_CACHE_KEY, {
            wagers: wagersData,
            stats: statsData
          });
        }
      } catch (err) {
        setError('Failed to fetch wagers data. Please try again.');
        console.error('Error fetching wagers:', err);
      } finally {
        setLoading(false);
        if (!search) {
          cacheService.clearPending(WAGERS_CACHE_KEY);
        }
      }
    };
    fetchWagers();
    
    return () => {
      cacheService.clearPending(WAGERS_CACHE_KEY);
    };
  }, []);

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    await fetchWagers(term);
  };

  // Toggle wager status (active/inactive)
  const handleWagerStatusChange = async (wagerId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(firestore, 'wagers', wagerId), {
        isActive
      });
      
      // Update local state
      setWagers(prev => prev.map(wager => 
        wager.id === wagerId 
          ? { ...wager, isActive }
          : wager
      ));
      
      // Invalidate cache
      cacheService.remove(WAGERS_CACHE_KEY);

      toast({
        title: "Success",
        description: `Wager ${isActive ? 'activated' : 'deactivated'} successfully`,
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update wager status",
        variant: "destructive",
      });
    }
  };

  // Toggle wager visibility (public/private)
  const handleWagerVisibilityChange = async (wagerId: string, isPrivate: boolean) => {
    try {
      await updateDoc(doc(firestore, 'wagers', wagerId), {
        isPrivate
      });
      
      // Update local state
      setWagers(prev => prev.map(wager => 
        wager.id === wagerId 
          ? { ...wager, isPrivate }
          : wager
      ));
      
      // Invalidate cache
      cacheService.remove(WAGERS_CACHE_KEY);

      toast({
        title: "Success",
        description: `Wager is now ${isPrivate ? 'private' : 'public'}`,
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update wager visibility",
        variant: "destructive",
      });
    }
  };

  // Edit wager
  const handleWagerUpdate = async (wagerId: string) => {
    toast({
      title: "Info",
      description: "Wager editor coming soon",
      variant: "default",
    });
  };

  // View wager details
  const handleViewDetails = async (wagerId: string) => {
    toast({
      title: "Info",
      description: "Wager details view coming soon",
      variant: "default",
    });
  };

  // Get status color
  const getStatusColor = (status: Wager['status']) => {
    switch (status) {
      case 'open':
        return 'text-green-500 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-500 dark:text-blue-400';
      case 'completed':
        return 'text-gray-500 dark:text-gray-400';
      case 'cancelled':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  // Handle add wager success
  const handleAddWagerSuccess = async () => {
    // Invalidate cache and refetch
    cacheService.remove(WAGERS_CACHE_KEY);
    await fetchWagers();
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-md dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Wager Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search wagers..."
              width="w-full sm:max-w-xs"
            />
            <Button 
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              onClick={() => setIsAddModalOpen(true)}
            >
              Create New Wager
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

            <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-400">Game</TableHead>
                  <TableHead className="dark:text-gray-400">Amount</TableHead>
                  <TableHead className="dark:text-gray-400 hidden sm:table-cell">Players</TableHead>
                  <TableHead className="dark:text-gray-400">Status</TableHead>
                  <TableHead className="dark:text-gray-400 hidden md:table-cell">Created</TableHead>
                  <TableHead className="dark:text-gray-400 hidden sm:table-cell">Active</TableHead>
                  <TableHead className="dark:text-gray-400 hidden lg:table-cell">Visibility</TableHead>
                  <TableHead className="dark:text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableLoadingState columns={8} rows={3} />
                ) : (
                  wagers.map((wager) => (
                    <TableRow key={wager.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{wager.gameName}</TableCell>
                      <TableCell className="dark:text-gray-300">₦{wager.amount.toFixed(2)}</TableCell>
                      <TableCell className="dark:text-gray-300 hidden sm:table-cell">
                        {wager.players}/{wager.maxPlayers}
                      </TableCell>
                      <TableCell className={getStatusColor(wager.status)}>
                        {wager.status.replace('_', ' ').toUpperCase()}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 hidden md:table-cell">
                        {new Date(wager.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Switch
                          checked={wager.isActive}
                          onCheckedChange={(checked) => handleWagerStatusChange(wager.id, checked)}
                          className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-400"
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`mr-2 ${wager.isPrivate ? 'text-gray-400' : 'text-blue-500'}`}
                            onClick={() => handleWagerVisibilityChange(wager.id, !wager.isPrivate)}
                            title={wager.isPrivate ? "Make Public" : "Make Private"}
                          >
                            {wager.isPrivate ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <span className="text-xs">
                            {wager.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleWagerUpdate(wager.id)}
                            className="dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(wager.id)}
                            className="dark:text-gray-300 dark:hover:bg-gray-700 hidden sm:inline-flex"
                          >
                            Details
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
          <CardTitle className="text-xl font-semibold dark:text-white">Wager Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Total Active</h3>
              <p className="text-2xl font-bold dark:text-white">{stats.totalActive.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Total Value</h3>
              <p className="text-2xl font-bold dark:text-white">₦{stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Avg. Size</h3>
              <p className="text-2xl font-bold dark:text-white">₦{stats.averageSize.toFixed(2)}</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Public Wagers</h3>
              <p className="text-2xl font-bold dark:text-white">{stats.publicWagers}</p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Private Wagers</h3>
              <p className="text-2xl font-bold dark:text-white">{stats.privateWagers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Wager Modal */}
      <AddWagerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddWagerSuccess}
      />
    </div>
  );
}