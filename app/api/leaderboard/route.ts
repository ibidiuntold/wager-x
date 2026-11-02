import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/mysql';

type LeaderboardType = 'global' | 'weekly' | 'friends';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as LeaderboardType | null;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 50) : 50;

  if (!type || !['global', 'weekly', 'friends'].includes(type)) {
    return NextResponse.json(
      { success: false, message: 'Invalid leaderboard type. Use global, weekly, or friends.' },
      { status: 400 }
    );
  }

  try {
    if (type === 'friends') {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      const userId = token.sub as string;

      const [rows]: any = await pool.query(
        `SELECT u.id, u.nickname, u.avatarUrl, u.totalWinnings, u.wagersPlayed, u.gamePoints
         FROM users u
         JOIN friendships f ON (
           (f.requesterId = ? AND f.addresseeId = u.id)
           OR (f.addresseeId = ? AND f.requesterId = u.id)
         )
         WHERE f.status = 'accepted'
         UNION
         SELECT id, nickname, avatarUrl, totalWinnings, wagersPlayed, gamePoints
         FROM users WHERE id = ?
         ORDER BY totalWinnings DESC
         LIMIT ?`,
        [userId, userId, userId, limit]
      );
      return NextResponse.json({ success: true, users: rows });
    }

    if (type === 'weekly') {
      const [rows]: any = await pool.query(
        `SELECT id, nickname, avatarUrl, weeklyWinnings, weeklyWagerCount, gamePoints
         FROM users
         ORDER BY weeklyWinnings DESC
         LIMIT ?`,
        [limit]
      );
      const isEmpty = (rows as any[]).every((r: any) => Number(r.weeklyWinnings) === 0);
      return NextResponse.json({ success: true, users: rows, isEmpty });
    }

    // type === 'global'
    const [rows]: any = await pool.query(
      `SELECT id, nickname, avatarUrl, totalWinnings, wagersPlayed, gamePoints
       FROM users
       ORDER BY totalWinnings DESC
       LIMIT ?`,
      [limit]
    );
    return NextResponse.json({ success: true, users: rows });
  } catch (error: any) {
    console.error('[GET /api/leaderboard] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard data.' },
      { status: 500 }
    );
  }
}
