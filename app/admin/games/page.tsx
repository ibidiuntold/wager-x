'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirestore, collection, getDocs, query, orderBy, limit, where, startAfter, endBefore, Query, DocumentData, doc, updateDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Gamepad2, MoreHorizontal, Eye, Ban, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Game {
  id: string;
  title: string;
  image: string;
  description: string;
  activeStatus: boolean;
  slug: string;
  gameSettings: {
    maxPlayers: number;
    minBalance: number;
    turnDuration: number;
    houseEdge: number;
  };
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState<DocumentData | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const router = useRouter();
  const { auth } = useAuth();
  const { toast } = useToast();

  async function fetchGames(
    searchQuery = '', 
    page = 1, 
    direction: 'next' | 'prev' = 'next',
    status = 'all'
  ) {
    try {
      setLoading(true);
      const db = getFirestore(getApp());
      const gamesRef = collection(db, 'games');
      
      let constraints: any[] = [orderBy('title', 'asc'), limit(pageSize)];

      if (status !== 'all') {
        constraints.push(where('activeStatus', '==', status === 'active'));
      }

      let q: Query<DocumentData> = query(gamesRef, ...constraints);

      // Add search filter if search term exists
      if (searchQuery) {
        q = query(
          gamesRef,
          where('title', '>=', searchQuery),
          where('title', '<=', searchQuery + '\uf8ff'),
          orderBy('title'),
          limit(pageSize)
        );
      }

      // Add pagination
      if (direction === 'next' && lastDoc) {
        q = query(q, startAfter(lastDoc));
      } else if (direction === 'prev' && firstDoc) {
        q = query(q, endBefore(firstDoc));
      }

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Game));
      
      setGames(gamesData);
      setCurrentPage(page);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auth.currentUser) {
      router.push('/admin/login');
      return;
    }

    fetchGames(searchTerm, currentPage, 'next', statusFilter);
  }, [auth.currentUser, router]);

  // Handle search input changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setFirstDoc(null);
    setLastDoc(null);
    fetchGames(value, 1, 'next', statusFilter);
  };

  // Handle status filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setFirstDoc(null);
    setLastDoc(null);
    fetchGames(searchTerm, 1, 'next', value);
  };

  // Handle page size changes
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    setCurrentPage(1);
    setFirstDoc(null);
    setLastDoc(null);
    fetchGames(searchTerm, 1, 'next', statusFilter);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (games.length === pageSize) {
      fetchGames(searchTerm, currentPage + 1, 'next');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchGames(searchTerm, currentPage - 1, 'prev');
    }
  };

  const handleToggleStatus = async (gameId: string, currentStatus: boolean) => {
    try {
      const db = getFirestore(getApp());
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        activeStatus: !currentStatus
      });
      
      toast({
        title: `Game ${currentStatus ? 'deactivated' : 'activated'} successfully`,
        description: `The game has been ${currentStatus ? 'deactivated' : 'activated'}.`,
      });
      
      // Refresh the games list
      fetchGames(searchTerm, currentPage, 'next', statusFilter);
    } catch (error) {
      console.error('Error toggling game status:', error);
      toast({
        title: "Error updating game status",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      <Card className="shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Games
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className='bg-white dark:bg-gray-800'>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size Selector */}
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent className='bg-white dark:bg-gray-800'>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border dark:border-0">
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 font-medium bg-slate-100 dark:bg-slate-900">
              <div className="col-span-2">Game</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading games...</div>
              ) : games.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No games found</div>
              ) : (
                games.map((game) => (
                  <div key={game.id} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-muted/50">
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden border dark:border-gray-800">
                        <Image
                          src={game.image}
                          alt={game.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{game.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {game.description}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game.activeStatus 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      }`}>
                        {game.activeStatus ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-start">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40 bg-white dark:bg-gray-800">
                          <Link href={`/admin/games/${game.id}`}>
                            <DropdownMenuItem className="cursor-pointer text-orange-500">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/admin/games/${game.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-500"
                            onClick={() => handleToggleStatus(game.id, game.activeStatus)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {game.activeStatus ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={games.length < pageSize || loading}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
