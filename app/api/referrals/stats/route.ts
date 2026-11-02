import { NextResponse } from "next/server";
import { getReferralStats } from "@/services/referralService";

export async function GET() {
  try {
    const referralStats = await getReferralStats();
    return NextResponse.json({ success: true, stats: referralStats });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch referral stats" }, { status: 500 });
  }
}
