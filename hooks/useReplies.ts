import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/reply";

export function useReplies(
  filters: { commentId?: string; userId?: string; wagerId?: string } = {},
  limit: number = 10
) {
  const [replies, setReplies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReplies = useCallback(
    async (append = false) => {
      try {
        setLoading(true);

        const query = new URLSearchParams();
        if (filters.commentId) query.append("commentId", filters.commentId);
        if (filters.userId) query.append("userId", filters.userId);
        if (filters.wagerId) query.append("wagerId", filters.wagerId);
        query.append("limit", String(limit));
        query.append("offset", String(offset));

        const res = await fetch(`${API_BASE}?${query.toString()}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to fetch replies");

        setTotal(result.total || 0);
        setReplies((prev) => (append ? [...prev, ...result] : result));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch replies"));
      } finally {
        setLoading(false);
      }
    },
    [filters.commentId, filters.userId, filters.wagerId, limit, offset]
  );

  useEffect(() => {
    fetchReplies(offset > 0); // append only when offset > 0
  }, [fetchReplies]);

  const loadMore = () => setOffset((prev) => prev + limit);
  const reset = () => setOffset(0);

  return {
    replies,
    setReplies,
    total,
    offset,
    loading,
    error,
    refresh: fetchReplies,
    loadMore,
    reset,
  };
}


export function useAddReply() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReply = async (commentId: string, wagerId: string, userId: string, reply: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, wagerId, userId, reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add reply");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addReply, loading, error };
}

export function useUpdateReply() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReply = async (replyId: string, reply: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update reply");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateReply, loading, error };
}

export function useDeleteReply() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReply = async (replyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${replyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete reply");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteReply, loading, error };
}