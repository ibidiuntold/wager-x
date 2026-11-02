import { NextResponse } from "next/server";
import { replyService } from "@/services/replyService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const wagerId = searchParams.get("wagerId") || undefined;

    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string, 10)
      : undefined;

    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset") as string, 10)
      : undefined;

    const replies = await replyService.getReplies(
      { commentId, userId, wagerId },
      { limit, offset }
    );

    return NextResponse.json(replies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newReply = await replyService.createReply(body);
    return NextResponse.json(newReply, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}