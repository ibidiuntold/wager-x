import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

const secret = process.env.NEXTAUTH_SECRET;

async function isAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  return token && token.role === "admin";
}

// GET all system settings (with pagination)
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // Fetch paginated data
    const [rows] = await pool.query(
      "SELECT * FROM system LIMIT ? OFFSET ?",
      [limit, offset]
    );

    // Get total count
    const [countRows]: any = await pool.query(
      "SELECT COUNT(*) as total FROM system"
    );
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// CREATE new system setting
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      appName,
      country,
      countryCode,
      currency,
      maxDeposit,
      minDeposit,
      minWithdrawalBalance,
      primaryColor,
      onMaintenance,
      withdrawalFee,
      enabled
    } = await request.json();

    const id = uuidv4();

    await pool.query(
      `INSERT INTO system 
      (id, appName, country, countryCode, currency, maxDeposit, minDeposit, 
       minWithdrawalBalance, primaryColor, onMaintenance, withdrawalFee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        appName,
        country,
        countryCode,
        currency,
        maxDeposit,
        minDeposit,
        minWithdrawalBalance,
        primaryColor,
        onMaintenance,
        withdrawalFee,
        enabled ? 1 : 0
      ]
    );

    return NextResponse.json({ message: "Setting created successfully", id });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create setting" },
      { status: 500 }
    );
  }
}
