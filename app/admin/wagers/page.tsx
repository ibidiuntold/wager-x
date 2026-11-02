'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAdminWagers } from '@/hooks/admin/useAdminWagers';
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal, Eye, Trash2, Search, ChevronLeft, ChevronRight, RefreshCcw, Layers, CircleDollarSign, Trophy, BarChart2, Ban,
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WagersPage() {
  const router = useRouter();
  const { user } = useAuth();

  // now pulling stats from the hook too
  const {
    wagers,
    pagination,
    loading,
    error,
    fetchWagers,
    fetchWagerStats,
    deleteWager,
    setFilters,
    stats
  } = useAdminWagers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!user) router.push('/admin/login');
  }, [user, router]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setFilters((prev) => ({ ...prev, category: value }));
  };

  const handleStatsRefresh = () => {
    fetchWagerStats();
  };

  // Render
  if (!user) return null;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={() => handleStatsRefresh()} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Section */}
      <div className='shadow rounded-md p-5 border space-y-2'>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-3">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className='font-bold text-xl'>Wagers Stats</h2>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleStatsRefresh}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Total Wagers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalWagers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-green-600" />
                Active Wagers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeWagers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-600" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedWagers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" />
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.cancelledWagers || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wagers Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 p-4">
          {/* TOP: Card Title (Takes full width in flex-col) */}
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <BarChart2 className="h-5 w-5 text-primary" />
            Wagers List
          </CardTitle>

          {/* BOTTOM ROW: Filters (Left) and Refresh Button (Right) */}
          <div className="flex items-center justify-between w-full">

            {/* LEFT SEGMENT: Search and Select Filters Group */}
            <div className="flex items-center gap-3">

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wagers..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 w-[250px] h-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[120px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[150px] h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="games">Games</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RIGHT SEGMENT: Refresh Button */}
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleStatsRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="grid grid-cols-9 gap-4 p-4 bg-muted/50 font-medium bg-slate-100 dark:bg-slate-900 rounded-t-lg border-t border-s border-e">
            <div>ID</div>
            <div className="col-span-2">Title</div>
            <div>Category</div>
            <div>Status</div>
            <div>Creator</div>
            <div>Created</div>
            <div>Expires</div>
            <div>Actions</div>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center border">Loading wagers...</div>
            ) : wagers.length === 0 ? (
              <div className="p-6 text-center border">No wagers found</div>
            ) : (
              wagers.map((wager) => (
                <div key={wager.id} className="grid grid-cols-9 gap-4 p-4 items-center hover:bg-muted/50 border">
                  <div>{wager.id.slice(0, 6)}...</div>
                  <div className="col-span-2">{wager.title || wager.description}</div>
                  <div>{wager.category}</div>
                  <div>{wager.status}</div>
                  <div>{wager.creatorId.slice(0, 6)}...</div>
                  <div>{formatDate(wager.createdAt)}</div>
                  <div>{formatDate(wager.expiresAt)}</div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <Link href={`/admin/wagers/${wager.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteWager(wager.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-s border-e rounded-b-lg">
            <div className="text-sm text-muted-foreground">
              Page {pagination?.pageNumber || 1} • Showing {wagers.length} of {pagination?.total || 0}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination?.pageNumber === 1}
                onClick={() => fetchWagers({ page: (pagination?.pageNumber || 1) - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination?.pageNumber === pagination?.totalPages}
                onClick={() => fetchWagers({ page: (pagination?.pageNumber || 1) + 1 })}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
