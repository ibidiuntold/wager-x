import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// 📍 GET a single social link
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows] = await pool.query("SELECT * FROM social_links WHERE id = ?", [params.id]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Social link not found" }, { status: 404 });
    }

    return NextResponse.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("GET /social-links/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch social link" }, { status: 500 });
  }
}

// 📍 UPDATE a social link
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { icon, link, name, enabled } = await request.json();

    await pool.query(
      `UPDATE social_links 
       SET icon = ?, link = ?, name = ?, enabled = ?
       WHERE id = ?`,
      [icon, link, name, enabled, params.id]
    );

    return NextResponse.json({ message: "Social link updated successfully" });
  } catch (error: any) {
    console.error("PUT /social-links/[id] error:", error);
    return NextResponse.json({ error: "Failed to update social link" }, { status: 500 });
  }
}

// 📍 DELETE a social link
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pool.query("DELETE FROM social_links WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "Social link deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /social-links/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete social link" }, { status: 500 });
  }
}
