import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from './userService';
// Settlement helpers are inlined via conn.query inside resolveWagerService's AtomicTransaction

/**
 * Read admin settings from the database using an existing connection.
 * Returns the parsed JSON data object, or {} if no settings row exists.
 * Using the passed `conn` keeps this read inside the same AtomicTransaction.
 */
async function readAdminSettings(conn: any): Promise<Record<string, any>> {
  const [rows]: any = await conn.query(
    `SELECT data FROM admin_settings WHERE id = 'main' LIMIT 1`
  );
  if (!rows || rows.length === 0) return {};
  try {
    const raw = rows[0].data;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

/**
 * Fetch wager by ID
 * @param id wagerId
 * @returns wager row or null
 */
export async function getWagerById(id: string) {
  const [rows] = await pool.query("SELECT * FROM wagers WHERE id = ?", [id]);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}


interface FilterOptions {
  limit?: number;
  pageNumber?: number;
  slug?: string;
  wagerContains?: string;
  category?: string;
  status?: string;
  creatorId?: string;
}

export async function getUserParticipatedWagers(userId: string, status?: 'open' | 'closed') {
  let sql = `
    SELECT
      w.*,
      wp.optionSelected,
      wp.amount AS wagerAmount,
      (SELECT SUM(amount) FROM wager_participants WHERE wagerId = w.id AND optionSelected = wp.optionSelected) AS totalOnSelectedOption,
      (SELECT SUM(amount) FROM wager_participants WHERE wagerId = w.id) AS totalPool
    FROM wagers w
    JOIN wager_participants wp ON w.id = wp.wagerId
    WHERE wp.userId = ?
  `;
  const params = [userId];

  if (status) {
    sql += ` AND w.status = ?`;
    params.push(status);
  } else {
    sql += ` AND w.status = 'open'`;
  }

  sql += ` ORDER BY w.createdAt DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getFilteredWagers(filters: FilterOptions) {
  const total = await pool.query('SELECT COUNT(*) as count FROM wagers');
  let sql = `
    SELECT 
      w.id, w.creatorId, w.category, w.createdAt, w.description, w.expiresAt,
      w.isPublic, w.image, w.options, w.slug, w.status, w.title,
      w.minimumEntry, w.totalPool, w.isResolved, w.wagerType,
      CASE 
        WHEN w.expiresAt <= NOW() THEN 'closed'
        ELSE w.status 
      END as actualStatus
    FROM wagers w
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  // Filters
  if (filters.wagerContains) {
    conditions.push(`(w.title LIKE ? OR w.description LIKE ?)`);
    params.push(`%${filters.wagerContains}%`, `%${filters.wagerContains}%`);
  }

  if (filters.slug) {
    conditions.push(`w.slug = ?`);
    params.push(filters.slug);
  }

  if (filters.category && filters.category.toLowerCase() !== 'all') {
    conditions.push(`w.category = ?`);
    params.push(filters.category);
  }

  if (filters.status && filters.status.toLowerCase() !== 'all') {
    const status = filters.status.toLowerCase();
    if (status === 'open') {
      // Must be open status AND not expired
      conditions.push(`w.status = 'open' AND w.expiresAt > NOW()`);
    } else if (status === 'closed') {
      // Either explicitly closed OR expired (regardless of status column)
      conditions.push(`(w.status = 'closed' OR w.expiresAt <= NOW())`);
    } else {
      // For any other status values, use them directly but still check expiry
      conditions.push(`w.status = ? AND w.expiresAt > NOW()`);
      params.push(filters.status);
    }
  }

  if (filters.creatorId) {
    conditions.push(`w.creatorId = ?`);
    params.push(filters.creatorId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }

  // Sorting - prioritize non-expired wagers first, then by totalPool, then by creation date
  sql += ` ORDER BY 
    CASE WHEN w.expiresAt > NOW() THEN 0 ELSE 1 END,
    w.totalPool DESC, 
    w.createdAt DESC`;

  // Pagination
  if (filters.limit) {
    const page = filters.pageNumber && filters.pageNumber > 0 ? filters.pageNumber : 1;
    const offset = (page - 1) * filters.limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit, offset);
  }

  const [rows] = await pool.query(sql, params);

  // Update the status of expired wagers in the result
  const processedRows = (rows as any[]).map(row => ({
    ...row,
    status: new Date(row.expiresAt) <= new Date() ? 'closed' : row.status
  }));

  const pagination = {
    page: filters.pageNumber || 1,
    limit: filters.limit || (total as any)[0][0].count,
    totalPages: filters.limit ? Math.ceil((total as any)[0][0].count / filters.limit) : 1,
    totalItems: (total as any)[0][0].count,
  };

  const wagerRows = { rows: processedRows, pagination };
  console.log("Wager Rows: ", wagerRows);
  return wagerRows;
}

export async function resolveWagerService(
  wagerId: string,
  winningOption: string,
  resolverId: string
) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Get wager info with ForUpdateLock (Requirement 1.7)
    const [wagerRows]: any = await conn.query(
      `SELECT * FROM wagers WHERE id = ? FOR UPDATE`,
      [wagerId]
    );
    if (!wagerRows.length) throw new Error('Wager not found.');
    const wager = wagerRows[0];

    // 2️⃣ Guard: already resolved (Requirement 1.8)
    if (wager.isResolved) {
      await conn.rollback();
      return { success: false, message: 'Wager already resolved.' };
    }

    // 3️⃣ Verify resolver (creator or admin) (Requirement 1.8)
    const user = await getUserById(resolverId);
    if (!user) throw new Error('Resolver user not found.');
    if (wager.creatorId !== resolverId && user?.role.toLowerCase() !== 'admin') {
      await conn.rollback();
      return { success: false, message: 'Only the wager creator or an admin can resolve this wager.' };
    }

    // 4️⃣ Update wager as resolved
    await conn.query(
      `UPDATE wagers SET isResolved = 1, status = 'closed', winningOption = ? WHERE id = ?`,
      [winningOption, wagerId]
    );

    // 4b️⃣ Read admin settings for platform fee config (Requirements 2.3, 2.4, 2.5)
    const settings = await readAdminSettings(conn);
    const feeRate: number = settings?.platformFeeRate ?? 0.05;
    const feeAccountId: string | null = settings?.platformFeeAccountId ?? null;

    // 5️⃣ Get participants with FOR UPDATE lock (Requirement 1.6)
    const [participants]: any = await conn.query(
      `SELECT userId, optionSelected, amount FROM wager_participants WHERE wagerId = ? FOR UPDATE`,
      [wagerId]
    );
    if (!participants.length) throw new Error('No participants found.');

    const totalPool = participants.reduce((sum: number, p: any) => sum + p.amount, 0);
    const winners = participants.filter((p: any) => p.optionSelected === winningOption);
    if (!winners.length) throw new Error('No winners found.');

    const winnerTotalStake = winners.reduce((sum: number, w: any) => sum + w.amount, 0);

    // 6️⃣ Create Settlement record (inline via conn)
    const settlementId = uuidv4();
    await conn.query(
      `INSERT INTO settlements (id, wagerId, creatorId, totalAmount, status, notes, createdAt)
       VALUES (?, ?, ?, ?, 'pending', NULL, NOW())`,
      [settlementId, wagerId, wager.creatorId, totalPool]
    );

    // 7️⃣ Distribute winnings proportionally & record settled users
    for (const winner of winners) {
      const winAmount = (winner.amount / winnerTotalStake) * totalPool;

      // Update winner balance + leaderboard counters
      await conn.query(
        `UPDATE users SET balance = balance + ?,
                          totalWinnings  = totalWinnings  + ?,
                          weeklyWinnings = weeklyWinnings + ?
         WHERE id = ?`,
        [winAmount, winAmount, winAmount, winner.userId]
      );

      // Insert WagerCredit transaction record (Requirement 2.2)
      const wagerCreditId = uuidv4();
      const wagerCreditRef = `wager_credit_${wagerId}_${winner.userId}_${Date.now()}`;
      await conn.query(
        `INSERT INTO transactions (id, userId, reference, amount, netAmount, processingFee, status, type, provider, createdAt)
         VALUES (?, ?, ?, ?, ?, 0, 'completed', 'wager_credit', 'internal', NOW())`,
        [wagerCreditId, winner.userId, wagerCreditRef, winAmount, winAmount]
      );

      // Create settled_user record (inline via conn)
      const settledUserId = uuidv4();
      await conn.query(
        `INSERT INTO settled_users (id, settlementId, wagerId, userId, amount, transactionId, createdAt)
         VALUES (?, ?, ?, ?, ?, NULL, NOW())`,
        [settledUserId, settlementId, wagerId, winner.userId, winAmount]
      );
    }

    // 7b️⃣ Collect platform fee (Requirements 2.3, 2.4, 2.5)
    const fee = Math.floor(totalPool * feeRate);
    if (feeAccountId) {
      // Credit platform fee account balance
      await conn.query(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [fee, feeAccountId]
      );
      // Insert PlatformFeeTransaction record
      const platformFeeId = uuidv4();
      const platformFeeRef = `platform_fee_${wagerId}_${Date.now()}`;
      await conn.query(
        `INSERT INTO transactions (id, userId, reference, amount, netAmount, processingFee, status, type, provider, createdAt)
         VALUES (?, ?, ?, ?, ?, 0, 'completed', 'wager_credit', 'internal', NOW())`,
        [platformFeeId, feeAccountId, platformFeeRef, fee, fee]
      );
    } else {
      console.warn('[resolveWagerService] platformFeeAccountId not configured — skipping fee insert');
    }

    // 8️⃣ Award gamePoints to ALL participants (Requirements 4.1–4.5)
    for (const participant of participants) {
      const basePoints = Math.floor(participant.amount / 100);
      const isWinner = participant.optionSelected === winningOption;
      const award = isWinner ? basePoints * 3 : basePoints; // winners: base + 2× bonus = 3×
      // Always execute — even when award === 0 (Requirement 4.4)
      await conn.query(
        `UPDATE users SET gamePoints = gamePoints + ? WHERE id = ?`,
        [award, participant.userId]
      );
    }

    // 8b️⃣ Increment wagersPlayed + weeklyWagerCount for ALL participants (Requirement 1.6)
    const participantIds = participants.map((p: any) => p.userId);
    await conn.query(
      `UPDATE users SET wagersPlayed = wagersPlayed + 1, weeklyWagerCount = weeklyWagerCount + 1 WHERE id IN (?)`,
      [participantIds]
    );

    // 9️⃣ Mark settlement as completed
    await conn.query(
      `UPDATE settlements SET status = 'completed', processedAt = NOW() WHERE id = ?`,
      [settlementId]
    );

    await conn.commit();

    return {
      success: true,
      message: `Wager resolved successfully — Winning option "${winningOption}" distributed.`,
      settlementId,
    };
  } catch (error: any) {
    // Requirement 1.8: rollback on any SQL error
    await conn.rollback();
    console.error('Error resolving wager:', error);
    return {
      success: false,
      message: error.message || 'Failed to resolve wager.',
    };
  } finally {
    // Requirement 1.6: always release connection back to pool
    conn.release();
  }
}

export async function createWager(data: any) {
  const { category, description, expiresAt, image, options, slug, status, title, minimumEntry, creatorId } = data;
  const wagerType = data.wagerType ?? 'p2p';
  console.log("This is the status: ", status);
  const wagerId = uuidv4();
  const [result] = await pool.query(
    'INSERT INTO wagers (id, creatorId, category, description, expiresAt, image, options, slug, status, title, minimumEntry, wagerType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [wagerId, creatorId, category, description, expiresAt, image, JSON.stringify(options), slug, status || 'open', title, minimumEntry, wagerType]
  );
  return result;
}

export async function updateWager(id: string, data: any) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  if (!fields) return null;
  const [result] = await pool.query(
    `UPDATE wagers SET ${fields} WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function deleteWager(id: string) {
  const [result] = await pool.query('DELETE FROM wagers WHERE id = ?', [id]);
  return result;
}

// services/wagerService.ts
import { RowDataPacket } from "mysql2";

interface WagerStatsFilters {
  month?: number; // 1 - 12
  year?: number;  // YYYY
}

export async function getWagersStats(filters: WagerStatsFilters = {}) {
  try {
    const now = new Date();
    const year = filters.year || now.getFullYear();
    const month = filters.month || null;

    // 📝 Build date filter dynamically
    let dateCondition = `YEAR(createdAt) = ${year}`;
    if (month) {
      dateCondition += ` AND MONTH(createdAt) = ${month}`;
    }

    // ✅ Total wagers
    const [totalWagersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalWagers 
       FROM wagers
       WHERE ${dateCondition}`
    );

    // ✅ Active wagers (not expired & not resolved & not cancelled/rejected)
    const [activeWagersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as activeWagers 
       FROM wagers 
       WHERE status = 'open' 
         AND expiresAt > NOW() 
         AND isResolved = 0
         AND ${dateCondition}`
    );

    // ✅ Completed wagers (expired/settled)
    const [completedWagersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as completedWagers 
       FROM wagers 
       WHERE (status = 'settled' OR status = 'closed' OR expiresAt < NOW() OR isResolved = 1)
         AND ${dateCondition}`
    );

    // ✅ Cancelled / Rejected wagers
    const [cancelledWagersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cancelledWagers 
       FROM wagers 
       WHERE status IN ('cancelled', 'rejected')
         AND ${dateCondition}`
    );

    // ✅ Total Volume Staked (sum of pools)
    const [totalVolumeResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(totalPool), 0) as totalVolumeStaked 
       FROM wagers
       WHERE ${dateCondition}`
    );

    // ✅ Total Payouts (if you track payouts separately)
    const [totalPayoutsResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(totalPool), 0) as totalPayouts 
       FROM wagers 
       WHERE status = 'settled' AND winningOption IS NOT NULL
         AND ${dateCondition}`
    );

    // ✅ Most Popular Category
    const [popularCategoryResult] = await pool.query<RowDataPacket[]>(
      `SELECT category, COUNT(*) as count
       FROM wagers
       WHERE ${dateCondition}
       GROUP BY category
       ORDER BY count DESC
       LIMIT 1`
    );

    // ✅ Profit / Hold %
    const staked = totalVolumeResult[0]?.totalVolumeStaked || 0;
    const payouts = totalPayoutsResult[0]?.totalPayouts || 0;
    const holdPercent = staked > 0 ? ((staked - payouts) / staked) * 100 : 0;

    return {
      totalWagers: totalWagersResult[0]?.totalWagers || 0,
      activeWagers: activeWagersResult[0]?.activeWagers || 0,
      completedWagers: completedWagersResult[0]?.completedWagers || 0,
      cancelledWagers: cancelledWagersResult[0]?.cancelledWagers || 0,
      totalVolumeStaked: staked,
      totalPayouts: payouts,
      profitHoldPercent: holdPercent,
      mostPopularCategory: popularCategoryResult[0]?.category || null,
      filter: { month, year },
    };
  } catch (error) {
    console.error("Error fetching wagers stats:", error);
    throw new Error("Database query failed");
  }
}

