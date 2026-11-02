"use client";

import { useState, useEffect, useCallback } from "react";

interface Bonus {
  id: string;
  name: string;
  description?: string;
  type?: "signup" | "deposit" | "referral" | "custom";
  amount?: number;
  criteria?: any;
  target?: "all" | "new_users" | "selected" | "custom" | "referrals";
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  creatorId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  pageNumber: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useAdminBonus(initialFilters: Record<string, any> = {}) {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  /** 🔹 Fetch Bonuses */
  const fetchBonuses = useCallback(
    async (params: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/bonuses", window.location.origin);
        const query = { ...filters, ...params };

        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
          }
        });

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch bonuses");

        // API returns { rows, pagination }
        setBonuses(data.rows || data);
        setPagination(data.pagination || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  /** 🔹 Create Bonus */
  const createBonus = async (payload: Partial<Bonus>) => {
    try {
      const res = await fetch("/api/bonuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create bonus");
      await fetchBonuses();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /** 🔹 Update Bonus */
  const updateBonus = async (id: string, updates: Partial<Bonus>) => {
    try {
      const res = await fetch(`/api/bonuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update bonus");
      await fetchBonuses();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /** 🔹 Delete Bonus */
  const deleteBonus = async (id: string) => {
    try {
      const res = await fetch(`/api/bonuses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete bonus");
      await fetchBonuses();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /** 🔹 Effects */
  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  return {
    bonuses,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    fetchBonuses,
    createBonus,
    updateBonus,
    deleteBonus,
  };
}
