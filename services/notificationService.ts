import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/mysql';

export async function getNotificationById(id: string) {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
  return Array.isArray(rows) ? rows[0] : null;
}

export async function getAllNotifications() {
  const [rows] = await pool.query('SELECT * FROM notifications ORDER BY createdAt DESC');
  return rows;
}

export async function createNotification(data: any) {
  const id = uuidv4();
  const {
    category,
    createdAt = new Date(),
    expiresAt = null,
    message,
    title,
    type,
    userId = null,
    buttonLink = null,
    buttonText = null,
  } = data;
  const status = false;
  const [result] = await pool.query(
    'INSERT INTO notifications (id, buttonLink, buttonText, category, createdAt, expiresAt, message, title, type, userId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, buttonLink, buttonText, category, createdAt, expiresAt, message, title, type, userId, status]
  );
  return { ...result, id };
}

export async function updateNotification(id: string, data: any) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE notifications SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function deleteNotification(id: string) {
  const [result] = await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
  return result;
} 