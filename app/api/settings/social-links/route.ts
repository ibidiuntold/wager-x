import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// 📍 GET all social links
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<any[]>(
      "SELECT * FROM social_links ORDER BY name ASC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [countRows] = await pool.query<any[]>(
      "SELECT COUNT(*) AS total FROM social_links"
    );
    const total = Array.isArray(countRows) && countRows.length ? (countRows[0] as any).total : 0;

    return NextResponse.json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /social-links error:", error);
    return NextResponse.json({ error: "Failed to fetch social links" }, { status: 500 });
  }
}

// 📍 CREATE new social link
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { icon, link, name, enabled } = await request.json();

    if (!icon || !link || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const id = uuidv4();

    await pool.query(
      `INSERT INTO social_links (id, icon, link, name, enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [id, icon, link, name, enabled]
    );

    return NextResponse.json({ message: "Social link created successfully", id });
  } catch (error: any) {
    console.error("POST /social-links error:", error);
    return NextResponse.json({ error: "Failed to create social link" }, { status: 500 });
  }
}
