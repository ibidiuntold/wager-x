// hooks/useAdminWagers.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface Wager {
  id: string;
  slug: string;
  description: string;
  category: string;
  creatorId: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  [key: string]: any;
}

interface Pagination {
  pageNumber: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WagerStats {
  totalWagers: number;
  activeWagers: number;
  completedWagers: number;
  cancelledWagers: number;
  totalVolumeStaked: number;
  totalPayouts: number;
  profitHoldPercent: number;
  mostPopularCategory: string | null;
  filter: {
    month: number;
    year: number;
  };
}


export function useAdminWagers(initialFilters: Record<string, any> = {}) {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<WagerStats | null>(null);

  const fetchWagers = useCallback(async (params: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/wagers", window.location.origin);
      const query = { ...filters, ...params };
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      });

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch wagers");
      }

      setWagers(data.wagers);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createWager = async (payload: Partial<Wager>) => {
    const res = await fetch("/api/wagers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const updateWager = async (id: string, payload: Partial<Wager>) => {
    const res = await fetch("/api/wagers", {
      method: "PUT",
      body: JSON.stringify({ id, ...payload }),
    });
    return res.json();
  };

  const deleteWager = async (id: string) => {
    const res = await fetch("/api/wagers", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    return res.json();
  };

  const resolveWager = async (wagerId: string, winningOption: string, resolverId: string) => {
    const res = await fetch("/api/wagers/resolve", {
      method: "POST",
      body: JSON.stringify({ wagerId, winningOption, resolverId }),
    });
    return res.json();
  };

  const getWagerById = async (wagerId: string) => {
    const res = await fetch(`/api/wagers/${wagerId}`);
    return res.json();
  };

  const fetchWagerStats = async (params: { year?: number; month?: number } = {}) => {
    try {
      const url = new URL("/api/wagers/stats", window.location.origin);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      });

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch wager stats");
      }

      setStats(data.stats);
      return data.stats;
    } catch (err: any) {
      console.error("Error fetching wager stats:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchWagers();
  }, [fetchWagers]);

  useEffect(() => {
    fetchWagerStats();
  }, []);

  const refreshWagers = async () => {
    await fetchWagers();
  };

  const refreshStats = async () => {
    await fetchWagerStats();
  };

  const refreshAll = async () => {
    await Promise.all([fetchWagers(), fetchWagerStats()]);
  };

  return {
    wagers,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    fetchWagers,
    createWager,
    updateWager,
    deleteWager,
    resolveWager,
    getWagerById,
    stats,
    fetchWagerStats,
    refreshWagers,
    refreshStats,
    refreshAll,
  };
}
