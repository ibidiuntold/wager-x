'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

interface WagerFilters {
  limit?: number;
  pageNumber?: number;
  slug?: string;
  wager_contains?: string;
  category?: string;
  minEntryMin?: number;
  minEntryMax?: number;
  creatorId?: string;
  status?: 'open' | 'closed' | 'all';
}

export function useWager(slug: string) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [wager, setWager] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actualWagerId, setActualWagerId] = useState<string>("");
  const [isCreator, setIsCreator] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const fetchWager = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ slug });
      const res = await fetch(`/api/wagers?${params.toString()}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch wager');

      const firstWager = result.wagers[0] || null;
      setWager(firstWager);
      setActualWagerId(firstWager?.id || "");
      setIsCreator(session?.user?.id === firstWager?.creatorId);
    } catch (err) {
      console.error("Error fetching wager:", err);
      setWager(null);
      setActualWagerId("");
    } finally {
      setIsLoading(false);
    }
  }, [slug, session?.user?.id]);

  const fetchParticipants = useCallback(async () => {
    if (!actualWagerId) return;
    try {
      const res = await fetch(`/api/wager-participants?wagerId=${encodeURIComponent(actualWagerId)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch participants');
      setParticipants(result.participants);
    } catch (err) {
      console.error("Error fetching participants:", err);
      setParticipants([]);
    }
  }, [actualWagerId]);

  // Expose the refetch functions directly
  const refetchWager = useCallback(() => {
    fetchWager();
  }, [fetchWager]);

  const refetchParticipants = useCallback(() => {
    fetchParticipants();
  }, [fetchParticipants]);


  useEffect(() => {
    if (slug) fetchWager();
  }, [slug, fetchWager]);

  useEffect(() => {
    if (actualWagerId) fetchParticipants();
  }, [actualWagerId, fetchParticipants]);

  const placeBet = async (optionSelected: string, amount: number) => {
    if (!actualWagerId || !session?.user?.id) {
      toast({ title: 'Error', description: 'Wager ID or User ID missing.', variant: 'destructive' });
      return false;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/wager-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wagerId: actualWagerId,
          userId: session.user.id,
          optionSelected,
          amount,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Failed to place bet');
      toast({ title: 'Bet placed', description: `Bet of ${amount} placed.` });
      refetchParticipants(); // Call the new refetch function
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place bet';
      const isInsufficientBalance = message === 'Insufficient balance';

      toast({
        title: isInsufficientBalance ? 'Insufficient Balance' : 'Error placing bet',
        description: isInsufficientBalance
          ? `You don't have enough funds to place this bet. Please top up your wallet and try again.`
          : message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wager,
    setWager,
    participants,
    setParticipants,
    isLoading,
    actualWagerId,
    isCreator,
    placeBet,
    showWalletModal,
    setShowWalletModal,
    refetchWager,
    refetchParticipants,
  };
}

// The useWagerQueries hook has been updated to fix the infinite loop
// hooks/useWagerHooks.ts
export function useWagerQueries(
  filters: WagerFilters = {},
  options: { enabled?: boolean } = { enabled: true }
) {
  const [wagers, setWagers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; totalItems: number }>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    options.enabled ? 'loading' : 'success'
  );
  const [error, setError] = useState<Error | null>(null);

  const fetchWagers = useCallback(async () => {
    setStatus('loading');
    try {
      const params = new URLSearchParams();

      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.pageNumber) params.append('pageNumber', String(filters.pageNumber));
      if (filters.wager_contains) params.append('wager_contains', filters.wager_contains);
      if (filters.category) params.append('category', filters.category);
      if (filters.minEntryMin !== undefined) params.append('minEntryMin', String(filters.minEntryMin));
      if (filters.creatorId) params.append('creatorId', filters.creatorId);
      if (filters.status) params.append('status', filters.status);
      if (filters.slug) params.append('slug', filters.slug);

      const res = await fetch(`/api/wagers?${params.toString()}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch wagers');

      setWagers(result.wagers);
      setPagination({
        page: result.pagination.page ?? filters.pageNumber ?? 1,
        totalPages: result.pagination.totalPages ?? 1,
        totalItems: result.pagination.totalItems ?? result.wagers.length,
      });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setStatus('error');
    }
  }, [filters]);

  useEffect(() => {
    if (options.enabled) {
      fetchWagers();
    }
  }, [fetchWagers, options.enabled]);

  return {
    wagers,
    pagination,
    status,
    error,
    refetch: fetchWagers,
  };
}

// --- New hook function to resolve a wager ---
export function useResolveWager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isResolving, setIsResolving] = useState(false);

  const resolveWager = useCallback(
    async (wagerId: string, winningOption: string) => {
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be signed in to resolve wagers.",
          variant: "destructive",
        });
        return false;
      }
      if (!wagerId || !winningOption) {
        toast({
          title: "Error",
          description: "Missing wager ID or winning option.",
          variant: "destructive",
        });
        return false;
      }

      setIsResolving(true);
      try {
        const res = await fetch(`/api/wagers/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wagerId,
            winningOption,
            resolverId: session.user.id,
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to resolve wager");

        toast({
          title: "Wager Resolved",
          description: `Winning option set: "${winningOption}"`,
        });

        return true;
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to resolve wager",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsResolving(false);
      }
    },
    [session?.user?.id, toast]
  );

  return { resolveWager, isResolving };
}

// --- New hook function to increase a participant's bet ---
export function useIncreaseBet() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isIncreasing, setIsIncreasing] = useState(false);

  const increaseBet = useCallback(
    async (wagerId: string, participantId: string, addAmount: number) => {
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be signed in to increase a bet.",
          variant: "destructive",
        });
        return false;
      }

      if (!wagerId || !participantId || !addAmount) {
        toast({
          title: "Error",
          description: "Missing wagerId, participantId, or addAmount.",
          variant: "destructive",
        });
        return false;
      }

      setIsIncreasing(true);
      try {
        const res = await fetch(`/api/wager-participants/${wagerId}/increase-bet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            addAmount: Number(addAmount),
            userId: session.user.id,
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to increase bet");

        toast({
          title: "Bet Increased",
          description: `Your bet was increased by ${addAmount}.`,
        });

        return result;
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to increase bet",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsIncreasing(false);
      }
    },
    [session?.user?.id, toast]
  );

  return { increaseBet, isIncreasing };
}

// --- New hook function to cashout a participant ---
export function useCashout() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isCashingOut, setIsCashingOut] = useState(false);

  const cashout = useCallback(
    async (wagerId: string, participantId: string) => {
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be signed in to cashout.",
          variant: "destructive",
        });
        return false;
      }

      if (!wagerId || !participantId) {
        toast({
          title: "Error",
          description: "Missing wagerId or participantId.",
          variant: "destructive",
        });
        return false;
      }

      setIsCashingOut(true);
      try {
        const res = await fetch(`/api/wager-participants/${wagerId}/cashout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to cashout");

        toast({
          title: "Cashout Successful",
          description: `You cashed out ${result.cashoutAmount} (fee: ${result.fee * 100}%).`,
        });

        return result;
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to cashout",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsCashingOut(false);
      }
    },
    [session?.user?.id, toast]
  );

  return { cashout, isCashingOut };
}
