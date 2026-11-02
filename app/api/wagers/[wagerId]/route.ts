// app/api/wagers/[wagerId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getWagerById } from "@/services/wagerService";

export async function GET(req: NextRequest, { params }: { params: { wagerId: string } }) {
  try {
    const wagerId = params.wagerId;

    if (!wagerId) {
      return NextResponse.json({ success: false, message: "Wager ID is required" }, { status: 400 });
    }

    const wager = await getWagerById(wagerId);

    if (!wager) {
      return NextResponse.json({ success: false, message: "Wager not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, wager });
  } catch (err: any) {
    console.error("Error fetching wager:", err);
    return NextResponse.json({ success: false, message: err.message || "Server error" }, { status: 500 });
  }
}
