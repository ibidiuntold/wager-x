import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// 📍 GET all SEO settings
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows] = await pool.query("SELECT * FROM seo ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /seo error:", error);
    return NextResponse.json({ error: "Failed to fetch SEO settings" }, { status: 500 });
  }
}

// 📍 CREATE new SEO setting
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, description, logoImage, favicon, catchPhrase } = await request.json();
    const id = Date.now().toString();

    await pool.query(
      `INSERT INTO seo (id, title, description, logoImage, favicon, catchPhrase)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, description, logoImage, favicon, catchPhrase]
    );

    return NextResponse.json({ message: "SEO setting created successfully", id });
  } catch (error: any) {
    console.error("POST /seo error:", error);
    return NextResponse.json({ error: "Failed to create SEO setting" }, { status: 500 });
  }
}
