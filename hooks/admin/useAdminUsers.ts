import { useState, useEffect, useCallback } from 'react';

interface UserStatus {
  isActive: boolean;
}

interface User extends UserStatus {
  id: string;
  email: string;
  nickname: string;
  lastLogin: string;
  status: string;
  createdAt: string;
  balance: number;
  walletBonus: number;
}

interface FetchUsersParams {
  searchTerm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  limit?: number;
}

interface UsersStats {
  totalUsers: number;
  activeUsers: number;
  registeredThisMonth: number;
  registeredThisYear: number;
  filter: {
    year?: number;
    month?: number;
  };
}

interface UseAdminUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  usersStats: UsersStats | null;
  statsLoading: boolean;
  statsError: string | null;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalItems: number;
  // Filters
  searchTerm: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
  // Actions
  fetchUsers: (params?: FetchUsersParams) => Promise<void>;
  fetchUsersStats: (params?: { year?: number; month?: number; }) => Promise<void>;
  refetchUsersStats: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refreshUsers: () => void;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export function useAdminUsers(): UseAdminUsersReturn {
  // State management for user list
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State management for global stats
  const [usersStats, setUsersStats] = useState<UsersStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Builds query parameters for API call
  const buildQueryParams = useCallback((params: FetchUsersParams = {}) => {
    const queryParams = new URLSearchParams();

    const {
      searchTerm: searchParam = searchTerm,
      status = statusFilter,
      startDate: startParam = startDate,
      endDate: endParam = endDate,
      pageNumber = currentPage,
      limit = pageSize,
    } = params;

    // Add pagination params
    queryParams.append('pageNumber', pageNumber.toString());
    queryParams.append('limit', limit.toString());

    // Add search params if they exist
    if (searchParam && searchParam.trim()) {
      queryParams.append('search', searchParam.trim());
    }

    // Add status filter
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }

    // Add date range filters
    if (startParam) {
      queryParams.append('from', startParam);
    }
    if (endParam) {
      queryParams.append('to', endParam);
    }

    return queryParams.toString();
  }, [searchTerm, statusFilter, startDate, endDate, currentPage, pageSize]);

  // Main fetch function for user list
  const fetchUsers = useCallback(async (params: FetchUsersParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryString = buildQueryParams(params);
      const response = await fetch(`/api/users?${queryString}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();

      setUsers(data.users || []);

      // Update pagination info
      const totalCount = data.pagination.totalItems || 0;
      const currentOffset = ((params.pageNumber ?? currentPage) - 1) * (params.limit ?? pageSize);
      const currentLimit = params.limit ?? pageSize;
      setTotalItems(totalCount);

      setHasNextPage(currentOffset + currentLimit < totalCount);
      setHasPrevPage(currentOffset > 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, currentPage, pageSize]);

  // New function to fetch global user stats  
  const fetchUsersStats = useCallback(async (params?: { year?: number; month?: number; }) => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      const queryParams = new URLSearchParams();
      if (params?.year) {
        queryParams.append('year', params.year.toString());
      }
      if (params?.month) {
        queryParams.append('month', params.month.toString());
      }

      const response = await fetch(`/api/users/stats?${queryParams.toString()}`);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch global stats');
      }

      const data = await response.json();
      setUsersStats(data.stats);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'An error occurred');
      setUsersStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Function to refetch global stats
  const refetchUsersStats = useCallback(() => {
    fetchUsersStats();
  }, [fetchUsersStats]);

  // Pagination functions
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  }, [hasPrevPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  // Refresh function
  const refreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  // User action functions
  const deactivateUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate user: ${response.statusText}`);
      }

      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }

      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUsers]);

  // Effect to fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  // Effect to fetch global stats on mount
  useEffect(() => {
    fetchUsersStats();
  }, [fetchUsersStats]);

  // Effect to reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUsers();
    }
  }, [searchTerm, statusFilter, startDate, endDate]);

  return {
    // Data
    users,
    loading,
    error,
    usersStats,
    statsLoading,
    statsError,

    // Pagination
    currentPage,
    pageSize,
    hasNextPage,
    hasPrevPage,
    totalItems,

    // Filters
    searchTerm,
    statusFilter,
    startDate,
    endDate,

    // Actions
    fetchUsers,
    fetchUsersStats,
    refetchUsersStats,
    setSearchTerm,
    setStatusFilter,
    setStartDate,
    setEndDate,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    refreshUsers,
    deactivateUser,
    deleteUser,
  };
}
