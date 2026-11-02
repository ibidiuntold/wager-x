import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notificationService';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

/** Create a pending friend request */
export async function createFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<Friendship> {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO friendships (id, requesterId, addresseeId, status) VALUES (?, ?, ?, 'pending')`,
    [id, requesterId, addresseeId]
  );
  const [rows]: any = await pool.query(`SELECT * FROM friendships WHERE id = ?`, [id]);
  return rows[0];
}

/** Send a friend request notification (best-effort — non-blocking) */
export async function notifyFriendRequest(
  requesterId: string,
  addresseeId: string,
  requesterNickname: string
): Promise<void> {
  try {
    await createNotification({
      userId: addresseeId,
      category: 'social',
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${requesterNickname} sent you a friend request.`,
      buttonLink: `/profile?userId=${requesterId}`,
      buttonText: 'View Request',
    });
  } catch (err) {
    console.error('[FriendshipService] Failed to create friend request notification:', err);
    // do not re-throw — notification failure is non-blocking
  }
}

/** Update a friendship's status — only the addressee may accept/reject */
export async function updateFriendshipStatus(
  id: string,
  status: 'accepted' | 'rejected'
): Promise<Friendship | null> {
  await pool.query(
    `UPDATE friendships SET status = ?, updatedAt = NOW() WHERE id = ?`,
    [status, id]
  );
  const [rows]: any = await pool.query(`SELECT * FROM friendships WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

/** Delete a friendship row */
export async function deleteFriendship(id: string): Promise<void> {
  await pool.query(`DELETE FROM friendships WHERE id = ?`, [id]);
}

/** Get a single friendship by id */
export async function getFriendshipById(id: string): Promise<Friendship | null> {
  const [rows]: any = await pool.query(`SELECT * FROM friendships WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

/** Check whether a friendship exists between two users (either direction) */
export async function getFriendshipBetween(
  userA: string,
  userB: string
): Promise<Friendship | null> {
  const [rows]: any = await pool.query(
    `SELECT * FROM friendships
     WHERE (requesterId = ? AND addresseeId = ?)
        OR (requesterId = ? AND addresseeId = ?)
     LIMIT 1`,
    [userA, userB, userB, userA]
  );
  return rows[0] ?? null;
}

/** All accepted friends for a user, with partner user details */
export async function getAcceptedFriends(userId: string): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT
       f.id,
       f.requesterId,
       f.addresseeId,
       f.status,
       u.id        AS friendId,
       u.nickname  AS friendNickname,
       u.avatarUrl AS friendAvatarUrl
     FROM friendships f
     JOIN users u ON u.id = CASE
       WHEN f.requesterId = ? THEN f.addresseeId
       ELSE f.requesterId
     END
     WHERE f.status = 'accepted'
       AND (f.requesterId = ? OR f.addresseeId = ?)`,
    [userId, userId, userId]
  );
  return rows;
}

/** Incoming pending friend requests (other user → current user) */
export async function getPendingIncomingRequests(userId: string): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT
       f.id,
       f.requesterId,
       f.createdAt,
       u.id        AS requesterId,
       u.nickname  AS requesterNickname,
       u.avatarUrl AS requesterAvatarUrl
     FROM friendships f
     JOIN users u ON u.id = f.requesterId
     WHERE f.addresseeId = ? AND f.status = 'pending'`,
    [userId]
  );
  return rows;
}

/** Outgoing pending friend requests (current user → other user) */
export async function getPendingOutgoingRequests(userId: string): Promise<any[]> {
  const [rows]: any = await pool.query(
    `SELECT
       f.id,
       f.addresseeId,
       f.createdAt,
       u.id        AS addresseeId,
       u.nickname  AS addresseeNickname,
       u.avatarUrl AS addresseeAvatarUrl
     FROM friendships f
     JOIN users u ON u.id = f.addresseeId
     WHERE f.requesterId = ? AND f.status = 'pending'`,
    [userId]
  );
  return rows;
}
