import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// 📍 GET one SMTP setting
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows] = await pool.query("SELECT * FROM smtp WHERE id = ?", [params.id]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "SMTP setting not found" }, { status: 404 });
    }

    return NextResponse.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("GET /smtp/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch SMTP setting" }, { status: 500 });
  }
}

// 📍 UPDATE SMTP setting
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { host, port, username, password, senderEmail, timeZone, enabled } = await request.json();

    await pool.query(
      `UPDATE smtp 
       SET host = ?, port = ?, username = ?, password = ?, senderEmail = ?, timeZone = ?, enabled = ?
       WHERE id = ?`,
      [host, port, username, password, senderEmail, timeZone || null, enabled, params.id]
    );

    return NextResponse.json({ message: "SMTP setting updated successfully" });
  } catch (error: any) {
    console.error("PUT /smtp/[id] error:", error);
    return NextResponse.json({ error: "Failed to update SMTP setting" }, { status: 500 });
  }
}

// 📍 DELETE SMTP setting
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pool.query("DELETE FROM smtp WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "SMTP setting deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /smtp/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete SMTP setting" }, { status: 500 });
  }
}
