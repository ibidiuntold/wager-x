import { NextRequest, NextResponse } from 'next/server';
import { getUserByNickname, getUserByEmail } from '@/services/userService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nickname = searchParams.get('nickname');
  const email = searchParams.get('email');

  if (!email && !nickname) {
    return NextResponse.json({ error: 'Missing email or nickname' }, { status: 400 });
  }

  // ✅ Check email first (if provided)
  if (email) {
    const user = await getUserByEmail(email);
    return NextResponse.json({ 
      field: 'email',
      available: !user 
    });
  }

  // ✅ Then check nickname (if provided and no email was sent)
  if (nickname) {
    const user = await getUserByNickname(nickname);
    return NextResponse.json({ 
      field: 'nickname',
      available: !user 
    });
  }
}
