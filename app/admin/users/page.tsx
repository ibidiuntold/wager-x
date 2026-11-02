'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MoreHorizontal, Eye, Ban, Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, RefreshCcw, Layers } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from 'react';

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');

  const {
    users,
    loading,
    error,
    usersStats,
    statsLoading,
    statsError,
    currentPage,
    pageSize,
    hasNextPage,
    hasPrevPage,
    totalItems,
    searchTerm,
    statusFilter,
    startDate,
    endDate,
    setSearchTerm,
    setStatusFilter,
    setStartDate,
    setEndDate,
    setPageSize,
    nextPage,
    prevPage,
    deactivateUser,
    deleteUser,
    refreshUsers,
    refetchUsersStats,
  } = useAdminUsers();

  console.log('Users data:', users); // Debug log

  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
    }
  }, [user, router]);

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Handle status filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle date filter changes
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };

  // Handle page size changes
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
  };

  // Handle user actions
  const handleDeactivateClick = (userId: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail);
    setDeactivateDialogOpen(true);
  };

  const handleDeleteClick = (userId: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(userEmail);
    setDeleteDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    try {
      await deactivateUser(selectedUserId);
      setDeactivateDialogOpen(false);
      setSelectedUserId('');
      setSelectedUserEmail('');
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to deactivate user:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(selectedUserId);
      setDeleteDialogOpen(false);
      setSelectedUserId('');
      setSelectedUserEmail('');
    } catch (error) {
      // Error is already handled in the hook
      console.error('Failed to delete user:', error);
    }
  };

  // Format date with validation
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
          <Alert
            variant="destructive"
            className="border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg"
          >
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300 flex items-center">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshUsers();
                  refetchUsersStats();
                }}
                className="ml-2 border-red-500 text-red-600 hover:bg-red-100 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-800/40"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats Cards */}
      <div className='shadow rounded-md p-5 border space-y-2'>
        <div className='flex items-center justify-between mx-auto'>
          <div className="flex justify-start items-center gap-x-3">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className='font-bold text-xl'>
              Users Stats </h2>
          </div>
          <button className="shadow active:shadow-none rounded-lg border p-2" title='Refresh Users Stats' onClick={refetchUsersStats}>
            <RefreshCcw className="h-5 w-5 text-black" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card className="shadow-sm border-0 bg-blue-200 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {statsLoading ? '...' : usersStats?.totalUsers || 0}
              </div>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-2">
                Registered users on the platform
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-green-200 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {statsLoading ? '...' : usersStats?.activeUsers || 0}
              </div>
              <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-2">
                Currently active accounts
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-purple-200 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Registered Users in {usersStats
                  ? new Date(usersStats?.filter?.year || new Date().getFullYear(), usersStats?.filter?.month - 1).toLocaleString('default', { month: 'long' })
                  : new Date().toLocaleString('default', { month: 'long' })}

              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {statsLoading ? '...' : usersStats?.activeUsers || 0}
              </div>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70 mt-2">
                Users registered this month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-orange-200 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                Registered Users in {usersStats
                  ? usersStats.filter.year
                  : new Date().getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {statsLoading ? '...' : usersStats?.activeUsers || 0}
              </div>
              <p className="text-sm text-orange-600/70 dark:text-orange-400/70 mt-2">
                Users registered this year
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Users Table */}
      <Card className="shadow rounded-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Users List
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or nickname..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filters */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-[150px]"
                title="From date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-[150px]"
                title="To date"
              />
            </div>

            {/* Page Size Selector */}
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            <button className="shadow active:shadow-none rounded-lg border p-2" onClick={refreshUsers}>
              <RefreshCcw className="h-5 w-5 text-black" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border dark:border-0">
            {/* Table Header */}
            <div className="grid grid-cols-8 gap-4 p-4 bg-muted/50 font-medium bg-slate-100 dark:bg-slate-900">
              <div>Username</div>
              <div className="col-span-2">Email</div>
              <div>Balance</div>
              <div>Last Login</div>
              <div>Status</div>
              <div>Joined</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || startDate || endDate ? (
                    <div>
                      <p className="text-lg mb-2">No users found</p>
                      <p className="text-sm">Try adjusting your search filters</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">No users yet</p>
                      <p className="text-sm">Users will appear here once they register</p>
                    </div>
                  )}
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="grid grid-cols-8 gap-4 p-4 items-center hover:bg-muted/50">
                    <div className="font-medium">{user.nickname || 'N/A'}</div>
                    <div className="col-span-2 text-muted-foreground">{user.email}</div>
                    <div className="text-muted-foreground">{Number(user.balance) + Number(user.walletBonus)}</div>
                    <div className="text-muted-foreground">
                      {formatDate(user.lastLogin)}
                    </div>
                    <div className="text-muted-foreground">
                      {user.status || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </div>
                    <div className="flex justify-start">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                          <Link href={`/admin/users/${user.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2 text-yellow-600"
                            onClick={() => handleDeactivateClick(user.id, user.email)}
                          >
                            <Ban className="h-4 w-4" />
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center gap-2 text-red-600"
                            onClick={() => handleDeleteClick(user.id, user.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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
                Page {currentPage} • Showing {users.length} of {totalItems} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage || loading}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage || loading}
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

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm User Deactivation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate the user with email "{selectedUserEmail}"?
              This will prevent them from accessing their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Deactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm User Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the user with email "{selectedUserEmail}"?
              This action cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}