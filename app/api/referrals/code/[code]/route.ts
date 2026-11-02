import {NextRequest, NextResponse} from "next/server";
import { getReferralByCode } from "@/services/referralService";

interface Params {
  params: {code: string}
}

// GET /api/referrals/code/[code]
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const referral = await getReferralByCode(params.code);

    if (!referral) {
      return NextResponse.json(
        { success: false, message: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, referral });
  } catch (error: any) {
    console.error("Error fetching referral:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch referral", error: error.message },
      { status: 500 }
    );
  }
}