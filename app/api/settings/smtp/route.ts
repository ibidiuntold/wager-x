import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// 📍 GET all SMTP settings
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows] = await pool.query("SELECT * FROM smtp ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /smtp error:", error);
    return NextResponse.json({ error: "Failed to fetch SMTP settings" }, { status: 500 });
  }
}

// 📍 CREATE new SMTP setting
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { host, port, username, password, senderEmail, timeZone, enabled } = await request.json();
    const id = uuidv4();

    if (!host || !port || !username || !password || !senderEmail) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO smtp (id, host, port, username, password, senderEmail, timeZone, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, host, port, username, password, senderEmail, timeZone || null, enabled]
    );

    return NextResponse.json({ message: "SMTP setting created successfully" });
  } catch (error: any) {
    console.error("POST /smtp error:", error);
    return NextResponse.json({ error: "Failed to create SMTP setting" }, { status: 500 });
  }
}
