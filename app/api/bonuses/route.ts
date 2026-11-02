import { NextResponse } from "next/server";
import { getAllBonuses, createBonus } from "@/services/bonusService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query params safely
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const target = searchParams.get("target") || undefined;

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

    const bonuses = await getAllBonuses({
      search,
      type,
      target,
      isActive,
      pageNumber,
      limit,
      orderBy,
      order,
    });

    return NextResponse.json({
      success: true,
      bonuses: bonuses.rows,
      pagination: bonuses.pagination,
    });
  } catch (error: any) {
    console.error("GET /api/bonuses error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bonuses", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const bonus = await createBonus(data);
    return NextResponse.json({ success: true, bonus }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/bonuses error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create bonus", error: error.message },
      { status: 500 }
    );
  }
}
