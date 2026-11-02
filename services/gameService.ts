import pool from '@/lib/mysql';

export async function getGameById(id: string) {
  const [rows] = await pool.query('SELECT * FROM games WHERE id = ?', [id]);
  return Array.isArray(rows) ? rows[0] : null;
}

export async function getAllGames() {
  const [rows] = await pool.query('SELECT * FROM games ORDER BY id ASC');
  return rows;
}

export async function createGame(data: any) {
  const { activeStatus, description, gameSettings, houseEdge, image, instructions, keywords, link, maxWager, minWager, monthPlayers, name, slug, title } = data;
  const [result] = await pool.query(
    'INSERT INTO games (id, activeStatus, description, gameSettings, houseEdge, image, instructions, keywords, link, maxWager, minWager, monthPlayers, name, slug, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [slug, activeStatus, description, JSON.stringify(gameSettings), houseEdge, image, instructions, keywords, link, maxWager, minWager, monthPlayers, name, slug, title]
  );
  return result;
}

export async function updateGame(id: string, data: any) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE games SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function deleteGame(id: string) {
  const [result] = await pool.query('DELETE FROM games WHERE id = ?', [id]);
  return result;
} 