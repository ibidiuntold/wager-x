import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/likes";

export function useLikes(targetId: string, targetType: "comment" | "reply", userId?: string) {
  const [count, setCount] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLikes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}?targetId=${targetId}&targetType=${targetType}&userId=${userId || ""}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch likes");

      setCount(data.count || 0);
      setLikedByUser(data.likedByUser || false);
    } catch (err) {
      console.error("Failed to fetch likes", err);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, userId]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = async () => {
    if (!userId) return; // must be logged in

    try {
      if (likedByUser) {
        // remove like
        const res = await fetch(
          `${API_BASE}/${targetId}?userId=${userId}&targetType=${targetType}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to unlike");
        setCount((c) => c - 1);
        setLikedByUser(false);
      } else {
        // add like
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId, targetId: targetId, targetType: targetType }),
        });
        if (!res.ok) throw new Error("Failed to like");
        setCount((c) => c + 1);
        setLikedByUser(true);
      }
    } catch (err) {
      console.error("Toggle like failed:", err);
    }
  };

  return { count, likedByUser, loading, toggleLike, refresh: fetchLikes };
}
