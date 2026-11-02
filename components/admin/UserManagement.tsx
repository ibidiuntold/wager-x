'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserProfile, UserRole, UserStatus } from '@/types/user.types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cacheService } from '@/services/cacheService';
import { useToast } from "@/components/ui/use-toast";
import { 
  SearchBar, 
  TableLoadingState, 
  PaginationControls 
} from "@/components/admin/common/AdminDashboardComponents";
import { statusOptions } from '@/lib/admin/config';

// Cache keys
const USERS_CACHE_KEY = 'admin_users';
const USERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const USERS_PER_PAGE = 10;

  // Create a cache key based on search parameters
  const createCacheKey = (searchQuery: string, pageNum: number) => {
    return `${USERS_CACHE_KEY}_${searchQuery || 'all'}_page${pageNum}`;
  };

  const fetchUsers = async (searchQuery = '', pageNum = 1, reset = false) => {
    // Reset state if needed
    if (reset) {
      setUsers([]);
      setLastVisible(null);
      setHasMore(true);
      setCurrentPage(1);
    } else {
      setCurrentPage(pageNum);
    }

    try {
      setError(null);
      
      // Create a cache key for this specific query
      const cacheKey = createCacheKey(searchQuery, pageNum);
      
      // Check if fetch is already pending
      if (cacheService.isPending(cacheKey)) {
        return;
      }
      
      // Check cache first (only for first page or reset)
      if ((pageNum === 1 || reset) && !searchQuery) {
        const cachedUsers = cacheService.get<{users: UserProfile[], lastDoc: any}>(
          cacheKey,
          USERS_CACHE_DURATION
        );
        
        if (cachedUsers) {
          setUsers(cachedUsers.users);
          setLastVisible(cachedUsers.lastDoc);
          setLoading(false);
          return;
        }
      }
      
      // Mark as loading and pending
      if (reset) {
        setLoading(true);
      }
      cacheService.setPending(cacheKey);

      // Build query
      let userQuery = `https://identity-service.onrender.com/api/users?page=${pageNum}&limit=${USERS_PER_PAGE}`;

      // Add search filter if needed
      if (searchQuery) {
        userQuery = `https://identity-service.onrender.com/api/users?page=${pageNum}&limit=${USERS_PER_PAGE}&search=${searchQuery}`;
      }

      // Add pagination if not resetting
      if (lastVisible && !reset && pageNum > 1) {
        userQuery = `https://identity-service.onrender.com/api/users?page=${pageNum}&limit=${USERS_PER_PAGE}&lastVisible=${lastVisible.id}`;
      }

      // Execute query
      const res = await fetch(userQuery);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      const newLastVisible = data.lastVisible;
      setLastVisible(newLastVisible);
      setHasMore(data.hasMore);

      // Update state based on reset flag
      if (reset || pageNum === 1) {
        setUsers(data.users);
        
        // Cache first page results
        cacheService.set(cacheKey, {
          users: data.users,
          lastDoc: newLastVisible
        });
      } else {
        setUsers(prev => [...prev, ...data.users]);
      }
      
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      cacheService.clearPending(createCacheKey(searchQuery, pageNum));
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers('', 1, true);
    
    // Cleanup function
    return () => {
      // Clear any pending fetches for this component
      const cacheKeys = cacheService.getKeys(new RegExp(`^${USERS_CACHE_KEY}`));
      cacheKeys.forEach(key => {
        cacheService.clearPending(key);
      });
    };
  }, [fetchUsers]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchUsers(term, 1, true);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchUsers(searchTerm, page, false);
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`https://identity-service.onrender.com/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const updatedUser = await res.json();
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.autoGeneratedId === userId 
          ? { ...user, role: updatedUser.role }
          : user
      ));

      // Invalidate cache for this entity
      const cacheKeys = cacheService.getKeys(new RegExp(`^${USERS_CACHE_KEY}`));
      cacheKeys.forEach(key => cacheService.remove(key));

      toast({
        title: "Success",
        description: "User role updated successfully",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      const res = await fetch(`https://identity-service.onrender.com/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const updatedUser = await res.json();
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.autoGeneratedId === userId 
          ? { ...user, status: updatedUser.status }
          : user
      ));

      // Invalidate cache for this entity
      const cacheKeys = cacheService.getKeys(new RegExp(`^${USERS_CACHE_KEY}`));
      cacheKeys.forEach(key => cacheService.remove(key));

      toast({
        title: "Success",
        description: "User status updated successfully",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // User detail view
  const handleViewDetails = (userId: string) => {
    // This would typically navigate to a user detail page
    toast({
      title: "Info",
      description: "User details view coming soon",
      variant: "default",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-md dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search users by name..."
              width="w-full sm:max-w-md"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {users.length === 0 && !loading && !error ? (
            <Alert className="mb-4">
              <AlertDescription>No users found.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-400">User</TableHead>
                      <TableHead className="dark:text-gray-400">Email</TableHead>
                      <TableHead className="dark:text-gray-400">Role</TableHead>
                      <TableHead className="dark:text-gray-400">Status</TableHead>
                      <TableHead className="dark:text-gray-400">Balance</TableHead>
                      <TableHead className="dark:text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableLoadingState columns={6} rows={5} />
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.autoGeneratedId} className="dark:border-gray-700">
                          <TableCell className="dark:text-gray-300">{user.nickname}</TableCell>
                          <TableCell className="dark:text-gray-300">{user.email}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  {user.role}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user.autoGeneratedId, 'user')}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  User
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user.autoGeneratedId, 'manager')}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  Manager
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user.autoGeneratedId, 'admin')}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  Admin
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost"
                                  className={`dark:text-gray-300 dark:hover:bg-gray-700 ${
                                    user.status === 'suspended' ? 'text-yellow-500 dark:text-yellow-400' :
                                    user.status === 'banned' ? 'text-red-500 dark:text-red-400' :
                                    'text-green-500 dark:text-green-400'
                                  }`}
                                >
                                  {user.status}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(user.autoGeneratedId, 'active')}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700 text-green-500"
                                >
                                  Active
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(user.autoGeneratedId, 'suspended')}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700 text-yellow-500"
                                >
                                  Suspended
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(user.autoGeneratedId, 'banned')}
                                  className="dark:text-gray-300 dark:hover:bg-gray-700 text-red-500"
                                >
                                  Banned
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="dark:text-gray-300">₦{user.walletBalance?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                              onClick={() => handleViewDetails(user.autoGeneratedId)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                hasMore={hasMore}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}