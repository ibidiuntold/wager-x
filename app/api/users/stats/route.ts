// app/api/users/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUsersStats } from "@/services/userService"; // <- the function we built

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins should see global stats
  if (token.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  try {
    const stats = await getUsersStats({ year, month });
    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error("Error fetching user stats:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}