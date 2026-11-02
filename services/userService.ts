import pool from '@/lib/mysql';
import { RowDataPacket } from "mysql2";
import { UserStatus } from '@/types/user.types'; // Assuming you have this type defined

export async function getUserByEmail(email: string) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return Array.isArray(rows) ? rows[0] : null;
}

export async function createUser(user: {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob?: string | null;
  nickname?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  referralCode?: string | null;
  role?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  emailVerified: boolean;
  kycVerified: boolean;
  gamePoints: number;
  balance: number;
  walletBonus: number;
}) {
  const [result] = await pool.query(
    `INSERT INTO users (
      id, avatarUrl, balance, createdAt, dob, email, emailVerified, firstName, lastName, gamePoints, kycVerified, lastLogin, updatedAt  , nickname, phoneNumber, referralCode, role, status, walletBonus, password
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.avatarUrl,
      user.balance,
      user.createdAt,
      user.dob,
      user.email,
      user.emailVerified,
      user.firstName,
      user.lastName,
      user.gamePoints,
      user.kycVerified,
      user.lastLogin,
      user.updatedAt,
      user.nickname,
      user.phoneNumber,
      user.referralCode,
      user.role,
      user.status,
      user.walletBonus,
      user.password
    ]
  );
  return result;
}

export async function getUserById(id: string) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return Array.isArray(rows) ? rows[0] : null;
}

export async function updateUserProfile(id: string, data: Partial<{ firstName: string; lastName: string; avatarUrl: string; nickname: string; phoneNumber: string; }>) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE users SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function updateUserByEmail(email: string, data: Partial<{ firstName: string; lastName: string; avatarUrl: string; nickname: string; phoneNumber: string; status: UserStatus; emailVerified: boolean; updatedAt: Date; }>) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE users SET ${fields} WHERE email = ?`,
    [...values, email]
  );
  return result;
}

export async function getUserByNickname(nickname: string) {
  const [rows] = await pool.query('SELECT * FROM users WHERE nickname = ?', [nickname]);
  return Array.isArray(rows) ? rows[0] : null;
} 

type UserBalanceData = {
  id: string;
  walletBalance: number;
  walletBonus: number;
  email?: string;
};

/**
 * Fetches a user's wallet and bonus balance from the database.
 * @param userId - The ID of the user
 * @returns UserBalanceData or null if not found
 */
export async function getUserBalance(userId: string): Promise<UserBalanceData | null> {
  const sql = `
    SELECT 
      id,
      balance     AS walletBalance,
      walletBonus AS walletBonus,
      email
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  try {
    const [rows] = await pool.query(sql, [userId]);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0] as UserBalanceData;
    }

    return null; // user not found
  } catch (error) {
    console.error('Error fetching user balance:', error);
    throw new Error('Database query failed');
  }
}

export async function getFilteredUsers(filters: {
  status?: string;
  searchTerm?: string;
  startDate?: string; // ISO string or YYYY-MM-DD
  endDate?: string;   // ISO string or YYYY-MM-DD
  pageNumber?: number;
  limit?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}) {
  // Whitelist of columns that can be used for ordering
  const allowedColumns = ['dob', 'createdAt', 'updatedAt'];
  const safeOrderBy = filters.orderBy && allowedColumns.includes(filters.orderBy)
    ? filters.orderBy
    : 'createdAt';

  // Ensure only ASC or DESC
  const safeOrder = filters.order && filters.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Base SQL
  let sql = `SELECT * FROM users u`;
  const conditions: string[] = [];
  const params: any[] = [];

  // Filters
  if (filters.status && filters.status.toLowerCase() !== 'all') {
    conditions.push(`u.status = ?`);
    params.push(filters.status);
  }

  if (filters.searchTerm) {
    conditions.push(`(u.nickname LIKE ? OR u.email LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)`); 
    params.push(
      `%${filters.searchTerm}%`,
      `%${filters.searchTerm}%`,
      `%${filters.searchTerm}%`,
      `%${filters.searchTerm}%`
    );
  }

  if (filters.startDate) {
    conditions.push(`u.createdAt >= ?`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`u.createdAt <= ?`);
    params.push(filters.endDate);
  }

  // Apply WHERE
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  // Sorting
  sql += ` ORDER BY u.${safeOrderBy} ${safeOrder}`;

  // Pagination
  const page = filters.pageNumber && filters.pageNumber > 0 ? filters.pageNumber : 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // Count query for pagination metadata
  let countSql = `SELECT COUNT(*) as count FROM users u`;
  if (conditions.length > 0) {
    countSql += ` WHERE ` + conditions.join(' AND ');
  }

  
  const [countRows] = await pool.query(countSql, params.slice(0, params.length - 2)); // remove limit/offset

  // Execute final query
  const [rows] = await pool.query(sql, params);

  const totalItems = (countRows as any)[0].count;

  const pagination = {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };

  return { rows, pagination };
}

interface UserStatsFilters {
  month?: number; // 1 - 12
  year?: number;  // YYYY
}

export async function getUsersStats(filters: UserStatsFilters = {}) {
  try {
    const now = new Date();
    const year = filters.year || now.getFullYear();
    const month = filters.month || now.getMonth() + 1; // JS months are 0-based

    const params: any[] = [year, month];

    // ✅ Total users
    const [totalUsersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalUsers FROM users u`
    );

    // ✅ Active users
    const [activeUsersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as activeUsers FROM users u WHERE u.status = 'active'`
    );

    // ✅ Registered in the selected month
    const [monthUsersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as registeredThisMonth 
       FROM users u 
       WHERE YEAR(u.createdAt) = ? AND MONTH(u.createdAt) = ?`,
      params
    );

    // ✅ Registered in the selected year
    const [yearUsersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as registeredThisYear 
       FROM users u 
       WHERE YEAR(u.createdAt) = ?`,
      [year]
    );

    return {
      totalUsers: totalUsersResult[0]?.totalUsers || 0,
      activeUsers: activeUsersResult[0]?.activeUsers || 0,
      registeredThisMonth: monthUsersResult[0]?.registeredThisMonth || 0,
      registeredThisYear: yearUsersResult[0]?.registeredThisYear || 0,
      filter: { month, year }, // ✅ helpful for frontend context
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw new Error("Database query failed");
  }
}
