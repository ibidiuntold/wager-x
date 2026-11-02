// app/api/users/status/route.ts
import { NextResponse } from "next/server";
import { getUserByEmail, getUserById, getUserByNickname } from "@/services/userService"; 
import { UserStatus } from "@/types/user.types"; // e.g. { id: string; email: string; active: boolean; nickname?: string }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const id = searchParams.get("id");
  const nickname = searchParams.get("nickname");

  if (!email && !id && !nickname) {
    return NextResponse.json(
      { error: "Provide either email, id, or nickname" },
      { status: 400 }
    );
  }

  try {
    let user: any = null;

    if (email) {
      user = await getUserByEmail(email);
    } else if (id) {
      user = await getUserById(id);
    } else if (nickname) {
      user = await getUserByNickname(nickname);
    }

    if (!user) {
      return NextResponse.json({ status: "not_found" });
    }

    return NextResponse.json({
      success: true,
      status: user.status as UserStatus,
      isVerified: user.emailVerified,
    });
  } catch (error: any) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
