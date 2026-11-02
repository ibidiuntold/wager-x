import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: string;
  userId: string;
  wagerId: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createComment(userId: string, wagerId: string, comment: string): Promise<Comment> {
  const id = uuidv4();
  const now = new Date();
  await pool.query(
    'INSERT INTO comments (id, userId, wagerId, comment, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, wagerId, comment, now, now]
  );
  return { id, userId, wagerId, comment, createdAt: now, updatedAt: now };
}

export async function getCommentById(commentId: string): Promise<Comment | null> {
  const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0] as Comment;
  }
  return null;
}

// ✅ Updated to support pagination
export async function getCommentsByWagerId(
  wagerId: string,
  limit?: number,
  offset?: number
): Promise<{ data: Comment[]; total: number }> {
  let sql = 'SELECT * FROM comments WHERE wagerId = ? ORDER BY createdAt DESC';
  const values: any[] = [wagerId];

  if (limit !== undefined) {
    sql += ' LIMIT ?';
    values.push(limit);
    if (offset !== undefined) {
      sql += ' OFFSET ?';
      values.push(offset);
    }
  }

  const [rows] = await pool.query(sql, values);
  const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM comments WHERE wagerId = ?', [wagerId]);

  return { data: rows as Comment[], total: countRows[0].count };
}

export async function updateComment(commentId: string, comment: string): Promise<void> {
  const now = new Date();
  await pool.query('UPDATE comments SET comment = ?, updatedAt = ? WHERE id = ?', [comment, now, commentId]);
}

export async function deleteComment(commentId: string): Promise<void> {
  await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
}
