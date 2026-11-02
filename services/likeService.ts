import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: "comment" | "reply";
  createdAt: Date;
}

/**
 * Get all likes for a specific target (comment or reply).
 */
export async function getLikes(targetId: string, targetType: "comment" | "reply"): Promise<Like[]> {
  const [rows] = await pool.query(
    "SELECT * FROM likes WHERE targetId = ? AND targetType = ?",
    [targetId, targetType]
  );
  return rows as Like[];
}

/**
 * Check if a user has liked a target.
 */
export async function getUserLike(userId: string, targetId: string, targetType: "comment" | "reply"): Promise<Like | null> {
  const [rows] = await pool.query(
    "SELECT * FROM likes WHERE userId = ? AND targetId = ? AND targetType = ? LIMIT 1",
    [userId, targetId, targetType]
  );
  if (Array.isArray(rows) && rows.length > 0) return rows[0] as Like;
  return null;
}

/**
 * Add a like.
 */
export async function addLike(userId: string, targetId: string, targetType: "comment" | "reply"): Promise<Like> {
  const id = uuidv4();
  const createdAt = new Date();
  await pool.query(
    "INSERT INTO likes (id, userId, targetId, targetType, createdAt) VALUES (?, ?, ?, ?, ?)",
    [id, userId, targetId, targetType, createdAt]
  );
  return { id, userId, targetId, targetType, createdAt };
}

/**
 * Remove a like.
 */
export async function removeLike(userId: string, targetId: string, targetType: "comment" | "reply"): Promise<void> {
  await pool.query(
    "DELETE FROM likes WHERE userId = ? AND targetId = ? AND targetType = ?",
    [userId, targetId, targetType]
  );
}
