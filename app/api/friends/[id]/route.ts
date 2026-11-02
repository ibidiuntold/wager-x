import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  getFriendshipById,
  updateFriendshipStatus,
  deleteFriendship,
} from '@/services/friendshipService';

async function requireAuth(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;
  return token.sub as string;
}

// PUT /api/friends/[id]  — accept or reject a friend request (addressee only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { status } = await req.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "status must be 'accepted' or 'rejected'." },
        { status: 400 }
      );
    }

    const friendship = await getFriendshipById(id);
    if (!friendship) {
      return NextResponse.json({ success: false, message: 'Friendship not found.' }, { status: 404 });
    }
    if (friendship.addresseeId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Only the addressee can accept or reject a request.' },
        { status: 403 }
      );
    }

    const updated = await updateFriendshipStatus(id, status as 'accepted' | 'rejected');
    return NextResponse.json({ success: true, friendship: updated });
  } catch (error: any) {
    console.error('[PUT /api/friends/[id]] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update friendship.' }, { status: 500 });
  }
}

// DELETE /api/friends/[id]  — unfriend or cancel a pending request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const friendship = await getFriendshipById(id);
    if (!friendship) {
      return NextResponse.json({ success: false, message: 'Friendship not found.' }, { status: 404 });
    }
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    await deleteFriendship(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/friends/[id]] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete friendship.' }, { status: 500 });
  }
}
