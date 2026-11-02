import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// GET single system setting
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows]: any = await pool.query("SELECT * FROM system WHERE id = ?", [params.id]);
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Setting not found" }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

// UPDATE system setting
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const fields = Object.keys(body);
    const values = Object.values(body);

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    const setClause = fields.map((key) => `${key} = ?`).join(", ");
    await pool.query(`UPDATE system SET ${setClause} WHERE id = ?`, [...values, params.id]);

    return NextResponse.json({ message: "Setting updated successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}

// DELETE system setting
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pool.query("DELETE FROM system WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "Setting deleted successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete setting" }, { status: 500 });
  }
}
