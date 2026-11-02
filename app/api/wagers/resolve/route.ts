import { NextRequest, NextResponse } from "next/server";
import { resolveWagerService } from "@/services/wagerService";

export async function POST(req: NextRequest) {
  try {
    const { wagerId, winningOption, resolverId } = await req.json();

    if (!wagerId || !winningOption || !resolverId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await resolveWagerService(wagerId, winningOption, resolverId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
