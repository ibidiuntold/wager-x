import { NextResponse } from "next/server";
import { cashout } from "@/services/wagerParticipantService";

export async function POST(req: Request, { params }: { params: { wagerId: string } }) {
  try {
    const { wagerId } = params;
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 });
    }

    const result = await cashout(wagerId, participantId);
    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error("Cashout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

