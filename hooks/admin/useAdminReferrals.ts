"use client";

import { useState, useEffect, useCallback } from "react";

interface Referral {
  id: string;
  referrerId: string;
  referralCode: string;
  uses: number;
  maxUses: number | null;
  bonusId: string | null;
  isActive: boolean;
  createdAt: string;
  referrerEmail?: string;
  referrerName?: string;
}

interface Pagination {
  pageNumber: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  inactiveReferrals: number;
  totalUses: number;
  avgUsesPerReferral: number;
  topReferrers: Array<{
    userId: string;
    referrerName: string;
    referrerEmail: string;
    totalCodes: number;
    totalUses: number;
  }>;
}

export function useAdminReferrals(initialFilters: Record<string, any> = {}) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  /** 🔹 Fetch Referrals */
  const fetchReferrals = useCallback(
    async (params: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/referrals", window.location.origin);
        const query = { ...filters, ...params };

        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
          }
        });

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch referrals");
        }

        setReferrals(data.referrals);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  /** 🔹 Fetch Referral Stats */
  const fetchReferralStats = useCallback(async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals/stats");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch referral stats");
      }

      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /** 🔹 Create Referral */
  const createReferral = async (payload: {
    referrerId: string;
    maxUses?: number | null;
    bonusId?: string | null;
  }) => {
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await fetchReferrals();
      await fetchReferralStats();
      return data.referral;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /** 🔹 Update Referral */
  const updateReferral = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await fetchReferrals();
      await fetchReferralStats();
      return data.referral;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /** 🔹 Delete Referral */
  const deleteReferral = async (id: string) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await fetchReferrals();
      await fetchReferralStats();
      return data.message;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /** 🔹 Effects */
  useEffect(() => {
    fetchReferrals();
    fetchReferralStats();
  }, [fetchReferrals, fetchReferralStats]);

  return {
    referrals,
    pagination,
    stats,
    loading,
    statsLoading,
    error,
    filters,
    setFilters,
    fetchReferrals,
    fetchReferralStats,
    createReferral,
    updateReferral,
    deleteReferral,
  };
}
