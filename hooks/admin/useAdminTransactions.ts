// hooks/useAdminTransactions.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface Transaction {
  id: number;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  amount: number;
  netAmount: number;
  processingFee: number;
  createdAt: string;
  updatedAt: string;
  provider: string;
  reference: string;
  providerReference: string;
  recipientCode: string;
  status: string;
  type: "deposit" | "withdrawal";
  userId: string;
  [key: string]: any;
}

interface Pagination {
  pageNumber: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  failedTransactions: number;
  totalVolume: number;
  totalFees: number;
  netVolume: number;
  filter: {
    month?: number;
    year?: number;
  };
}

export function useAdminTransactions(initialFilters: Record<string, any> = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<TransactionStats | null>(null);

  // ✅ Fetch transactions
  const fetchTransactions = useCallback(
    async (params: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/transactions", window.location.origin);
        const query = { ...filters, ...params };

        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, String(v));
          }
        });

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch transactions");
        }

        setTransactions(data.transactions);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // ✅ Fetch transaction stats
  const fetchTransactionStats = useCallback(
    async (params: { year?: number; month?: number } = {}) => {
      try {
        const url = new URL("/api/transactions/stats", window.location.origin);

        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, String(v));
          }
        });

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch transaction stats");
        }

        setStats(data.stats);
        return data.stats;
      } catch (err: any) {
        console.error("Error fetching transaction stats:", err);
        throw err;
      }
    },
    []
  );

  // ✅ Actions
  const refreshTransactions = async () => {
    await fetchTransactions();
  };

  const refreshStats = async () => {
    await fetchTransactionStats();
  };

  const refreshAll = async () => {
    await Promise.all([fetchTransactions(), fetchTransactionStats()]);
  };

  // ✅ Effects
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactionStats();
  }, [fetchTransactionStats]);

  return {
    transactions,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    stats,
    fetchTransactions,
    fetchTransactionStats,
    refreshTransactions,
    refreshStats,
    refreshAll,
  };
}
