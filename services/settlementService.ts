// services/settlementService.ts
import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

interface GetAllSettlementsOptions {
  status?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  limit?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
}

/**
 * Get all settlements with filtering, search, sorting, and pagination
 */
export async function getAllSettlements(options: GetAllSettlementsOptions) {
  const {
    status,
    searchTerm,
    startDate,
    endDate,
    pageNumber = 1,
    limit = 10,
    orderBy = "createdAt",
    order = "DESC",
  } = options;

  let conditions: string[] = [];
  let values: any[] = [];

  if (status) {
    conditions.push("s.status = ?");
    values.push(status);
  }

  if (searchTerm) {
    conditions.push(`(u.nickname LIKE ? OR w.description LIKE ? OR w.title LIKE? OR s.notes LIKE ?)`);
    values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (startDate && endDate) {
    conditions.push("s.createdAt BETWEEN ? AND ?");
    values.push(startDate, endDate);
  } else if (startDate) {
    conditions.push("s.createdAt >= ?");
    values.push(startDate);
  } else if (endDate) {
    conditions.push("s.createdAt <= ?");
    values.push(endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const offset = (pageNumber - 1) * limit;

  const query = `
    SELECT 
      s.*, 
      u.nickname AS creatorName, 
      w.description AS wagerDescription
    FROM settlements s
    LEFT JOIN users u ON s.creatorId = u.id
    LEFT JOIN wagers w ON s.wagerId = w.id
    ${whereClause}
    ORDER BY s.${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;

  const [rows]: any = await pool.query(query, [...values, limit, offset]);

  // Get total count for pagination
  const [countRows]: any = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM settlements s
      LEFT JOIN users u ON s.creatorId = u.id
      LEFT JOIN wagers w ON s.wagerId = w.id
      ${whereClause}
    `,
    values
  );

  const total = countRows[0]?.total || 0;

  return {
    rows,
    pagination: {
      total,
      pageNumber,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


/**
 * Create a new settlement record
 */
export async function createSettlement(
  wagerId: string,
  creatorId: string,
  totalAmount: number,
  notes?: string
) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO settlements (id, wagerId, creatorId, totalAmount, status, notes, createdAt)
     VALUES (?, ?, ?, ?, 'pending', ?, NOW())`,
    [id, wagerId, creatorId, totalAmount, notes || null]
  );
  return { id, wagerId, creatorId, totalAmount, status: 'pending' };
}

/**
 * Create settled user record
 */
export async function createSettledUser(
  settlementId: string,
  wagerId: string,
  userId: string,
  amount: number,
  transactionId?: string
) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO settled_users (id, settlementId, wagerId, userId, amount, transactionId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [id, settlementId, wagerId, userId, amount, transactionId || null]
  );
  return { id, settlementId, wagerId, userId, amount };
}

/**
 * Update settlement status
 */
export async function updateSettlementStatus(settlementId: string, status: string) {
  await pool.query(
    `UPDATE settlements SET status = ?, processedAt = NOW() WHERE id = ?`,
    [status, settlementId]
  );
}

/**
 * Get settlement by wagerId
 */
export async function getSettlementByWagerId(wagerId: string) {
  const [rows]: any = await pool.query(
    `SELECT * FROM settlements WHERE wagerId = ?`,
    [wagerId]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Get all settled users by settlementId
 */
export async function getSettledUsersBySettlementId(settlementId: string) {
  const [rows]: any = await pool.query(
    `SELECT su.*, u.nickname, u.email
     FROM settled_users su
     JOIN users u ON su.userId = u.id
     WHERE su.settlementId = ?`,
    [settlementId]
  );
  return rows;
}

/**
 * Get all settled users by wagerId
 */
export async function getSettledUsersByWagerId(wagerId: string) {
  const [rows]: any = await pool.query(
    `SELECT su.*, u.nickname, u.email
     FROM settled_users su
     JOIN users u ON su.userId = u.id
     WHERE su.wagerId = ?`,
    [wagerId]
  );
  return rows;
}
