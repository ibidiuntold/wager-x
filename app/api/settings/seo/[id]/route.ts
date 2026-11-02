import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// 📍 GET one SEO setting
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows] = await pool.query("SELECT * FROM seo WHERE id = ?", [params.id]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "SEO setting not found" }, { status: 404 });
    }

    return NextResponse.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("GET /seo/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch SEO setting" }, { status: 500 });
  }
}

// 📍 UPDATE SEO setting
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, description, logoImage, favicon, catchPhrase } = await request.json();

    await pool.query(
      `UPDATE seo 
       SET title = ?, description = ?, logoImage = ?, favicon = ?, catchPhrase = ?, id = ?
       WHERE id = ?`,
      [title, description, logoImage, favicon, catchPhrase, Date.now().toString(), params.id]
    );

    return NextResponse.json({ message: "SEO setting updated successfully" });
  } catch (error: any) {
    console.error("PUT /seo/[id] error:", error);
    return NextResponse.json({ error: "Failed to update SEO setting" }, { status: 500 });
  }
}

// 📍 DELETE SEO setting
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pool.query("DELETE FROM seo WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "SEO setting deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /seo/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete SEO setting" }, { status: 500 });
  }
}
