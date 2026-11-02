import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/comments";

// Hook: Fetch comments for a wager

export function useComments(wagerId: string | null, limit: number = 5, offset: number = 0) {
  const [comments, setComments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    if (!wagerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}?wagerId=${wagerId}&limit=${limit}&offset=${offset}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to fetch comments");
      setComments(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch comments"));
    } finally {
      setLoading(false);
    }
  }, [wagerId, limit, offset]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, setComments, total, loading, error, refresh: fetchComments };
}

// Hook: Add a comment
export function useAddComment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = async (wagerId: string, userId: string, comment: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}?wagerId=${wagerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add comment");
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addComment, loading, error };
}

// Hook: Update a comment
export function useUpdateComment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateComment = async (wagerId: string, commentId: string, userId: string, comment: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${commentId}?wagerId=${wagerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update comment");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateComment, loading, error };
}

// Hook: Delete a comment
export function useDeleteComment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteComment = async (wagerId: string, commentId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${commentId}?userId=${userId}&wagerId=${wagerId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete comment");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteComment, loading, error };
}
