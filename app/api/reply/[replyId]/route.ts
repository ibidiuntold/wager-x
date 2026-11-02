import { NextResponse } from "next/server";
import { replyService } from "@/services/replyService";

interface Params {
  params: { replyId: string };
}

export async function GET(_: Request, { params }: Params) {
  try {
    const reply = await replyService.getReplyById(params.replyId);
    if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    return NextResponse.json(reply);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { reply } = await req.json();
    const updatedReply = await replyService.updateReply(params.replyId, reply);
    return NextResponse.json(updatedReply);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await replyService.deleteReply(params.replyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
