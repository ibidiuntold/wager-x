"use client";

import LikeButton from "./LikeButton";
import { getTimeAgo } from "@/lib/utils";

export default function ReplySection({ reply, userId }: any) {
  return (
    <div className="flex items-start space-x-2">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 shrink-0 font-semibold">
        {reply.user?.nickname?.[0]?.toUpperCase() || "R"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {reply.user?.nickname || "Anonymous"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {getTimeAgo(new Date(reply.updatedAt))}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
          {reply.reply}
        </p>
        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <LikeButton targetId={reply.id} targetType="reply" userId={userId} size={12} />
        </div>
      </div>
    </div>
  );
}
