import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.NEXTAUTH_SECRET;

// Helper: verify admin
async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

/** -------------------- GET (paginated list) -------------------- **/
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const [rows]: any = await pool.query(
      `SELECT * FROM payment_gateways ORDER BY provider ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]]: any = await pool.query(
      "SELECT COUNT(*) as total FROM payment_gateways"
    );

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
    console.error("GET /settings/payment-gateways error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment gateways" },
      { status: 500 }
    );
  }
}

/** -------------------- POST (create new) -------------------- **/
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      provider,
      enabled,
      test,
      live_secret_key,
      live_public_key,
      test_secret_key,
      test_public_key,
    } = await request.json();

    if (!provider || !live_secret_key || !live_public_key || !test_secret_key || !test_public_key) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const id = uuidv4();

    await pool.query(
      `INSERT INTO payment_gateways 
      (id, provider, enabled, test, live_secret_key, live_public_key, test_secret_key, test_public_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        provider,
        enabled ? 1 : 0,
        test ? 1 : 0,
        live_secret_key,
        live_public_key,
        test_secret_key,
        test_public_key,
      ]
    );

    return NextResponse.json({ message: "Payment gateway created successfully" });
  } catch (error: any) {
    console.error("POST /settings/payment-gateways error:", error);
    return NextResponse.json(
      { error: "Failed to create payment gateway" },
      { status: 500 }
    );
  }
}
