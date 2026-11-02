import { NextResponse } from "next/server";
import { getWagerById } from "@/services/wagerService";
import { getCommentsByWagerId, createComment } from "@/services/commentService";
import { getUserById } from "@/services/userService";

interface Params {
  wagerId: string;
}

export async function GET(req: Request, context: { params: Params }) {
  const { searchParams } = new URL(req.url);
  const wagerId = searchParams.get("wagerId");

  if (!wagerId) {
    return NextResponse.json({ success: false, error: "wagerId is required" }, { status: 400 });
  }

  const wagerExists = await getWagerById(wagerId);
  if (!wagerExists) {
    return NextResponse.json({ success: false, error: "Wager not found" }, { status: 404 });
  }

  try {
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 0) : undefined;

    const { data: comments, total } = await getCommentsByWagerId(wagerId, limit, offset);

    const populatedComments = await Promise.all(
      comments.map(async (comment: any) => {
        const user = await getUserById(comment.userId);
        return {
          ...comment,
          user: user
            ? {
                id: user.id,
                email: user.email,
                firstname: user.firstName,
                lastname: user.lastName,
                avatarUrl: user.avatarUrl,
                nickname: user.nickname,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, data: populatedComments, total }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { searchParams } = new URL(req.url);
  const wagerId = searchParams.get("wagerId");

  if (!wagerId) {
    return NextResponse.json({ success: false, error: "wagerId is required" }, { status: 400 });
  }

  try {
    const { userId, comment: newCommentText } = await req.json();

    if (!userId || !newCommentText) {
      return NextResponse.json({ success: false, error: "userId and comment are required" }, { status: 400 });
    }

    const wagerExists = await getWagerById(wagerId);
    if (!wagerExists) {
      return NextResponse.json({ success: false, error: "Wager not found" }, { status: 404 });
    }

    const userExists = await getUserById(userId);
    if (!userExists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const createdComment = await createComment(userId, wagerId, newCommentText);
    return NextResponse.json({ success: true, data: createdComment }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
