"use client";

import { useState, useEffect, useCallback } from "react";

interface Settlement {
  id: string;
  wagerId: string;
  creatorId: string;
  creatorName?: string;
  wagerDescription?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

interface Pagination {
  total: number;
  pageNumber: number;
  limit: number;
  totalPages: number;
}

interface SettlementStats {
  totalSettlements: number;
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
}

export function useAdminSettlements(initialFilters: Record<string, any> = {}) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<SettlementStats | null>(null);

  // ✅ Fetch settlements list
  const fetchSettlements = useCallback(
    async (params: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/settlement", window.location.origin);
        const query = { ...filters, ...params };

        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, String(v));
          }
        });

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch settlements");

        setSettlements(data.settlements);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
      } finally { 
        setLoading(false);
      }
    },
    [filters]
  );

  // ✅ Fetch settlement stats
  const fetchSettlementStats = useCallback(async () => {
    try {
      const res = await fetch("/api/settlement/stats");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch settlement stats");
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // ✅ Update settlement status
  const updateSettlement = async (settlementId: string, status: string) => {
    try {
      const res = await fetch("/api/settlement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId, status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchSettlements();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ✅ Fetch Settled Users
  const fetchSettledUsers = async (settlementId: string) => {
    const res = await fetch(`/api/settlement/${settlementId}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return data.data;
  };

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  useEffect(() => {
    fetchSettlementStats();
  }, [fetchSettlementStats]);

  return {
    settlements,
    pagination,
    stats,
    loading,
    error,
    filters,
    setFilters,
    fetchSettlements,
    fetchSettlementStats,
    updateSettlement,
    fetchSettledUsers,
  };
}
