import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  createFriendRequest,
  notifyFriendRequest,
  getAcceptedFriends,
  getPendingIncomingRequests,
  getPendingOutgoingRequests,
  getFriendshipBetween,
} from '@/services/friendshipService';
import pool from '@/lib/mysql';

async function requireAuth(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  return token.sub as string;
}

export async function GET(req: NextRequest) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'requests' | 'sent' | null (accepted friends)

  try {
    if (type === 'requests') {
      const requests = await getPendingIncomingRequests(userId);
      return NextResponse.json({ success: true, requests });
    }
    if (type === 'sent') {
      const sent = await getPendingOutgoingRequests(userId);
      return NextResponse.json({ success: true, sent });
    }
    // default: accepted friends
    const friends = await getAcceptedFriends(userId);
    return NextResponse.json({ success: true, friends });
  } catch (error: any) {
    console.error('[GET /api/friends] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch friends.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { addresseeId } = await req.json();

    if (!addresseeId) {
      return NextResponse.json({ success: false, message: 'addresseeId is required.' }, { status: 400 });
    }
    if (userId === addresseeId) {
      return NextResponse.json(
        { success: false, message: 'Cannot send a friend request to yourself.' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await getFriendshipBetween(userId, addresseeId);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Friend request already exists.' },
        { status: 409 }
      );
    }

    const friendship = await createFriendRequest(userId, addresseeId);

    // Fetch requester nickname for the notification (best-effort)
    const [rows]: any = await pool.query('SELECT nickname FROM users WHERE id = ?', [userId]);
    const requesterNickname: string = rows[0]?.nickname ?? 'Someone';
    await notifyFriendRequest(userId, addresseeId, requesterNickname);

    return NextResponse.json({ success: true, friendship }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/friends] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send friend request.' }, { status: 500 });
  }
}
