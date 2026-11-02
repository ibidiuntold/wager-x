import { NextResponse } from "next/server";
import {
  getAllReferrals,
  createReferralForUser,
} from "@/services/referralService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query parameters safely
    const searchCode = searchParams.get("searchCode") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam === null
        ? undefined
        : isActiveParam === "true"
        ? true
        : false;
    const pageNumber = Number(searchParams.get("pageNumber")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = (searchParams.get("order") as "ASC" | "DESC") || "DESC";

    // Pass query object properly
    const referrals = await getAllReferrals({
      searchCode,
      isActive,
      pageNumber,
      limit,
      orderBy,
      order,
    });

    return NextResponse.json({
      success: true,
      referrals: referrals.rows,
      pagination: referrals.pagination,
    });
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch referrals",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { referrerId, maxUses, bonusId } = await request.json();

    if (!referrerId) {
      return NextResponse.json(
        { success: false, message: "referrerId is required" },
        { status: 400 }
      );
    }

    const newReferral = await createReferralForUser(
      referrerId,
      maxUses,
      bonusId
    );
    return NextResponse.json({ success: true, referral: newReferral });
  } catch (error: any) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create referral",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
