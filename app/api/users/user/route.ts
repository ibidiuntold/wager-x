import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, getUserByEmail, getUserByNickname } from "@/services/userService";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");
  const nickname = searchParams.get("nickname");

  if (!id && !email && !nickname) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  // ✅ Normal users → only themselves
  if (token.role === "user") {
    if (id && id !== token.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getUserById(token.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, user });
  }

  // ✅ Admin → can fetch by id, email, or nickname
  if (token.role === "admin") {
    let user = null;

    if (email) user = await getUserByEmail(email);
    else if (nickname) user = await getUserByNickname(nickname);
    else if (id) user = await getUserById(id);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, user });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
