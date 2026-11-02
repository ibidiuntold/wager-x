// app/api/wagers/[wagerId]/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { getWagerById } from "@/services/wagerService";
import { getCommentById, updateComment, deleteComment } from "@/services/commentService";
import { getUserById } from "@/services/userService";

interface Params {
  wagerId: string;
  commentId: string;
}

// PUT /api/wagers/[wagerId]/comments/[commentId]
export async function PUT(req: Request, context: { params: Promise<Params> }) {
  const { commentId } = await context.params; // ✅ await
  const { searchParams } = new URL(req.url); // ✅ query string
  const wagerId = searchParams.get("wagerId");

  if (!wagerId || !commentId) {
    return NextResponse.json(
      { success: false, error: "wagerId and commentId are required" },
      { status: 400 }
    );
  }

  try {
    const { userId, comment: updatedCommentText } = await req.json();
    if (!userId || !updatedCommentText) {
      return NextResponse.json(
        { success: false, error: "userId and comment text are required" },
        { status: 400 }
      );
    }
    const wagerExists = await getWagerById(wagerId);
    if (!wagerExists) {
      return NextResponse.json(
        { success: false, error: "Wager not found" },
        { status: 404 }
      );
    }

    const userExists = await getUserById(userId);
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const commentToModify = await getCommentById(commentId);
    if (!commentToModify) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (commentToModify.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only update your own comments" },
        { status: 403 }
      );
    }

    await updateComment(commentId, updatedCommentText);
    return NextResponse.json(
      { success: true, message: "Comment updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[commentId]
export async function DELETE(req: Request, context: { params: Promise<Params> }) {
  const { commentId } = await context.params; // ✅ await
  const { searchParams } = new URL(req.url); // ✅ query string
  const wagerId = searchParams.get("wagerId");


  if (!wagerId || !commentId) {
    return NextResponse.json(
      { success: false, error: "wagerId and commentId are required" },
      { status: 400 }
    );
  }

  try {

    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const wagerExists = await getWagerById(wagerId);
    if (!wagerExists) {
      return NextResponse.json(
        { success: false, error: "Wager not found" },
        { status: 404 }
      );
    }

    const userExists = await getUserById(userId);
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const commentToModify = await getCommentById(commentId);
    if (!commentToModify) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (commentToModify.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own comments" },
        { status: 403 }
      );
    }

    await deleteComment(commentId);
    return NextResponse.json(
      { success: true, message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
