import { NextResponse } from "next/server";
import {
  getBonusById,
  updateBonus,
  deleteBonus,
  getBonusUsersByBonusId,
} from "../../../../services/bonusService";

interface Params {
  params: { id: string };
}

/**
 * GET /api/bonuses/[id]
 * Optionally: ?includeUsers=true to also fetch related bonus users
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const includeUsers = searchParams.get("includeUsers") === "true";

    const bonus = await getBonusById(params.id);
    if (!bonus)
      return NextResponse.json({ error: "Bonus not found" }, { status: 404 });

    if (includeUsers) {
      const users = await getBonusUsersByBonusId(params.id);
      return NextResponse.json({ ...bonus, users });
    }

    return NextResponse.json(bonus);
  } catch (error: any) {
    console.error(`GET /api/bonuses/${params.id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/bonuses/[id]
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const data = await req.json();
    await updateBonus(params.id, data);
    return NextResponse.json({ message: "Bonus updated successfully" });
  } catch (error: any) {
    console.error(`PATCH /api/bonuses/${params.id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/bonuses/[id]
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await deleteBonus(params.id);
    return NextResponse.json({ message: "Bonus deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/bonuses/${params.id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
