import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";

const secret = process.env.NEXTAUTH_SECRET;

// Helper: verify admin
async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

/** -------------------- GET by ID -------------------- **/
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const [rows]: any = await pool.query(
      "SELECT * FROM payment_gateways WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Payment gateway not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("GET /settings/payment-gateways/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment gateway" },
      { status: 500 }
    );
  }
}

/** -------------------- PUT (update by ID) -------------------- **/
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const updates = await request.json();

    const {
      provider,
      enabled,
      test,
      live_secret_key,
      live_public_key,
      test_secret_key,
      test_public_key,
    } = updates;

    await pool.query(
      `UPDATE payment_gateways
       SET provider = ?, enabled = ?, test = ?, 
           live_secret_key = ?, live_public_key = ?, 
           test_secret_key = ?, test_public_key = ?
       WHERE id = ?`,
      [
        provider,
        enabled ? 1 : 0,
        test ? 1 : 0,
        live_secret_key,
        live_public_key,
        test_secret_key,
        test_public_key,
        id,
      ]
    );

    return NextResponse.json({ message: "Payment gateway updated successfully" });
  } catch (error: any) {
    console.error("PUT /settings/payment-gateways/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update payment gateway" },
      { status: 500 }
    );
  }
}

/** -------------------- DELETE -------------------- **/
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    await pool.query("DELETE FROM payment_gateways WHERE id = ?", [id]);

    return NextResponse.json({ message: "Payment gateway deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /settings/payment-gateways/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete payment gateway" },
      { status: 500 }
    );
  }
}
