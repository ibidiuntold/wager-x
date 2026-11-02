import pool from '@/lib/mysql';

export async function getSubscriberById(id: number) {
  const [rows] = await pool.query('SELECT * FROM subscribers WHERE id = ?', [id]);
  return Array.isArray(rows) ? rows[0] : null;
}

export async function getAllSubscribers() {
  const [rows] = await pool.query('SELECT * FROM subscribers ORDER BY createdAt DESC');
  return rows;
}

export async function createSubscriber(data: any) {
  const { email } = data;
  const [result] = await pool.query(
    'INSERT INTO subscribers (email, createdAt) VALUES (?, NOW())',
    [email]
  );
  return result;
}

export async function updateSubscriber(id: number, data: any) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE subscribers SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function deleteSubscriber(id: number) {
  const [result] = await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);
  return result;
} 