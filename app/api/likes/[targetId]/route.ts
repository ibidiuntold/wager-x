import { NextResponse } from "next/server";
import { removeLike } from "@/services/likeService";

interface Params {
  params: Promise<{ targetId: string }>;
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { targetId } = await params; // ✅ await the params

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const targetType = searchParams.get("targetType") as "comment" | "reply";

    if (!userId || !targetType) {
      return NextResponse.json(
        { error: "user_id and target_type are required" },
        { status: 400 }
      );
    }

    await removeLike(userId, targetId, targetType);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
