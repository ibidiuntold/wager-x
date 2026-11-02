"use client";

import { useState } from "react";
import { useReplies, useAddReply } from "@/hooks/useReplies";
import ReplySection from "./ReplySection";
import LikeButton from "./LikeButton";
import { CommentSkeleton } from "../ui/comment-skeleton";
import { getTimeAgo } from "@/lib/utils";

export default function CommentItem({ comment, userId }: any) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  const { replies, total, loading, loadMore, reset, refresh } = useReplies(
    { commentId: comment.id },
    3
  );
  const { addReply } = useAddReply();

  const toggleReplies = () => setShowReplies((prev) => !prev);
  const toggleReplyForm = () => setShowReplyForm((prev) => !prev);

  const handleReply = async () => {
    if (!replyText.trim() || !userId) return;
    await addReply(comment.id, comment.wagerId, userId, replyText);
    setReplyText("");
    setShowReplyForm(false);
    reset();
    refresh(false);
  };

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 mb-4 bg-white dark:bg-gray-900">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
          {comment.user?.nickname?.[0]?.toUpperCase() || "A"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {comment.user?.nickname || "Anonymous"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getTimeAgo(new Date(comment.updatedAt))}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">
            {comment.comment.length > 200
              ? comment.comment.slice(0, 200) + "..."
              : comment.comment}
          </p>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <LikeButton targetId={comment.id} targetType="comment" userId={userId} size={14} />
            {replies && replies.length > 0 && (
              <button
                onClick={toggleReplies}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {showReplies ? "Hide Replies" : `Show Replies (${total})`}
              </button>
            )}
            <button
              onClick={toggleReplyForm}
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Reply
            </button>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3 ml-6">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                rows={2}
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
              >
                Send Reply
              </button>
            </div>
          )}

          {/* Replies List */}
          {showReplies && (
            <div className="mt-4 ml-6 space-y-2">
              {loading && replies.length === 0 ? (
                <>
                  <CommentSkeleton />
                  <CommentSkeleton />
                </>
              ) : replies.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No replies yet.</p>
              ) : (
                <>
                  {replies.map((r) => (
                    <ReplySection key={r.id} reply={r} userId={userId} />
                  ))}
                  {replies.length < total && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={loadMore}
                        className="px-3 py-1 text-xs text-purple-600 dark:text-purple-400 border border-purple-600 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        Show More Replies
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
