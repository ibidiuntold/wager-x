import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createNotification } from '@/services/notificationService';

export async function POST(req: NextRequest) {
  // Admin-only endpoint
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.json({ success: false, message: 'Authentication check failed' }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (token.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await req.json();

    const { title, message, type, category, scope, buttons } = data;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'title and message are required' },
        { status: 400 }
      );
    }

    // userId = null means global broadcast (all users)
    const result = await createNotification({
      title,
      message,
      type: type ?? 'info',
      category: category ?? 'dropdown',
      userId: null,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('[POST /api/notifications/broadcast] Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to broadcast notification' },
      { status: 500 }
    );
  }
}
