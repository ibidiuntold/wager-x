// app/api/referrals/[id]/route.ts
import { NextResponse } from "next/server";
import {
  getReferralById,
  updateReferral,
  deleteReferral,
} from "@/services/referralService";

interface Params {
  params: { id: string };
}

// GET /api/referrals/[id]
export async function GET(_: Request, { params }: Params) {
  try {
    const referral = await getReferralById(params.id);

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

// PATCH /api/referrals/[id]
export async function PATCH(request: Request, { params }: Params) {
  try {
    const updates = await request.json();
    const updatedReferral = await updateReferral(params.id, updates);

    if (!updatedReferral) {
      return NextResponse.json(
        { success: false, message: "Referral not found or not updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, referral: updatedReferral });
  } catch (error: any) {
    console.error("Error updating referral:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update referral", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/referrals/[id]
export async function DELETE(_: Request, { params }: Params) {
  try {
    const success = await deleteReferral(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Referral not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Referral deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting referral:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete referral", error: error.message },
      { status: 500 }
    );
  }
}
