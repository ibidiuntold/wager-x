import pool from "@/lib/mysql";
import { NextResponse, NextRequest } from "next/server";
import { getAllSettlements, updateSettlementStatus, getSettlementByWagerId } from "@/services/settlementService";
import { getToken } from "next-auth/jwt";

// ✅ GET all settlements (with filtering & pagination)
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || undefined;
    const searchTerm = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const pageNumber = Number(searchParams.get("pageNumber")) || 1;
    const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = (searchParams.get("order") as "ASC" | "DESC") || "DESC";

    // Only admin or moderator roles can view all settlements
    if (token.role !== "admin" && token.role !== "moderator") {
      return NextResponse.json(
        { error: "Forbidden: Only admins or moderators can view settlements" },
        { status: 403 }
      );
    }

    const settlements = await getAllSettlements({
      status,
      searchTerm,
      startDate,
      endDate,
      pageNumber,
      limit,
      orderBy,
      order,
    });

    return NextResponse.json({
      success: true,
      settlements: settlements.rows,
      pagination: settlements.pagination,
    });
  } catch (error: any) {
    console.error("Error fetching settlements:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


// ✅ PATCH to update settlement status or notes
export async function PATCH(request: NextRequest) {
  try {
    const { settlementId, status, notes } = await request.json();
    if (!settlementId) {
      return NextResponse.json({ success: false, message: 'settlementId is required' }, { status: 400 });
    }

    if (status) await updateSettlementStatus(settlementId, status);
    if (notes) {
      await pool.query(`UPDATE settlements SET notes = ? WHERE id = ?`, [notes, settlementId]);
    }

    const updatedSettlement = await getSettlementByWagerId(settlementId);
    return NextResponse.json({ success: true, data: updatedSettlement });
  } catch (error: any) {
    console.error('Error updating settlement:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
