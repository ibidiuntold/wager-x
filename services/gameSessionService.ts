import pool from '@/lib/mysql';

export async function getGameSessionById(id: string) {
  const [rows] = await pool.query('SELECT * FROM game_sessions WHERE id = ?', [id]);
  return Array.isArray(rows) ? rows[0] : null;
}

export async function getAllGameSessions() {
  const [rows] = await pool.query('SELECT * FROM game_sessions ORDER BY startTime DESC');
  return rows;
}

export async function createGameSession(data: any) {
  const { config, currentTurn, endTime, gameId, gameState, isRandomMatch, lastActivityTime, moves, players, startTime, status, wager, winner, expiresAt } = data;
  const [result] = await pool.query(
    'INSERT INTO game_sessions (config, currentTurn, endTime, gameId, gameState, isRandomMatch, lastActivityTime, moves, players, startTime, status, wager, winner, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [JSON.stringify(config), currentTurn, endTime, gameId, JSON.stringify(gameState), isRandomMatch, lastActivityTime, JSON.stringify(moves), JSON.stringify(players), startTime, status, wager, winner, expiresAt]
  );
  return result;
}

export async function updateGameSession(id: string, data: any) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE game_sessions SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function deleteGameSession(id: string) {
  const [result] = await pool.query('DELETE FROM game_sessions WHERE id = ?', [id]);
  return result;
} 