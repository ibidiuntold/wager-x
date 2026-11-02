import { NextResponse } from "next/server";
import { getLikes, addLike, getUserLike, removeLike } from "@/services/likeService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("targetId");
    const targetType = searchParams.get("targetType") as "comment" | "reply";
    const userId = searchParams.get("userId");

    if (!targetId || !targetType) {
      return NextResponse.json({ error: "targetId and targetType are required" }, { status: 400 });
    }

    const likes = await getLikes(targetId, targetType);
    const userLike = userId ? await getUserLike(userId, targetId, targetType) : null;

    return NextResponse.json({
      count: likes.length,
      likedByUser: !!userLike,
      likes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, targetId, targetType } = await req.json();
    if (!userId || !targetId || !targetType) {
      return NextResponse.json({ error: "userId, targetId, and targetType are required" }, { status: 400 });
    }

    // Check if already liked
    const existing = await getUserLike(userId, targetId, targetType);
    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    const like = await addLike(userId, targetId, targetType);
    return NextResponse.json(like, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
