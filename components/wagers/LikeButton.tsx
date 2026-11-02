"use client";

import { Heart } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";

interface LikeButtonProps {
  targetId: string;
  targetType: "comment" | "reply";
  userId?: string;
  size?: number;
}

export default function LikeButton({ targetId, targetType, userId, size = 14 }: LikeButtonProps) {
  const { count, likedByUser, toggleLike, loading } = useLikes(targetId, targetType, userId);

  return (
    <button
      onClick={toggleLike}
      disabled={!userId || loading}
      className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
        likedByUser
          ? "text-purple-600 dark:text-purple-400"
          : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
      }`}
    >
      <Heart
        size={size}
        className={likedByUser ? "fill-current" : ""}
      />
      <span className="text-xs">{count}</span>
    </button>
  );
}
