"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAddComment } from "@/hooks/useComments";
import { useToast } from "@/components/ui/use-toast";
import CommentItem from "./CommentItem";
import { CommentSkeleton } from "../ui/comment-skeleton";

interface CommentSectionProps {
  wagerId: string;
}

export default function CommentSection({ wagerId }: CommentSectionProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = (user as any)?.id;
  const userNickname = (user as any)?.nickname || user?.name;

  const { addComment, loading: adding } = useAddComment();
  const { toast } = useToast();

  const [comments, setComments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [limit] = useState(3);
  const [offset, setOffset] = useState(0);

  const fetchComments = async (append = false) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/comments?wagerId=${wagerId}&limit=${limit}&offset=${offset}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch comments");
      setTotal(data.total || 0);
      setComments((prev) => (append ? [...prev, ...data.data] : data.data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(offset > 0);
  }, [offset]);

  const handleAdd = async () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to add a comment.",
        variant: "destructive",
      });
      return;
    }
    if (!newComment.trim()) return;

    try {
      const created = await addComment(wagerId, userId, newComment);
      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (err: any) {
      toast({
        title: "Failed to add comment",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleShowMore = () => setOffset((prev) => prev + limit);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Comments ({total})
      </h2>

      {/* Comment Input */}
      {userId ? (
        <div className="mb-6 flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-semibold text-white text-sm shrink-0">
            {userNickname ? userNickname[0].toUpperCase() : "U"}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAdd}
                disabled={adding || !newComment.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {adding ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Please log in to add a comment.
        </p>
      )}

      {/* Comment List */}
      {loading && offset === 0 ? (
        <>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </>
      ) : (
        <>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} userId={userId} />
          ))}
          {comments.length < total && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleShowMore}
                className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 border border-purple-600 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                Show More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
