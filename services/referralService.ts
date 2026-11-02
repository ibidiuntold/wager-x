import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

/**
 * Get referrals with pagination, filtering, and search
 */
export async function getAllReferrals({
  searchCode,
  isActive,
  pageNumber = 1,
  limit = 10,
  orderBy = "createdAt",
  order = "DESC",
}: {
  searchCode?: string;
  isActive?: boolean;
  pageNumber?: number;
  limit?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
}) {
  const offset = (pageNumber - 1) * limit;
  const conditions: string[] = [];
  const values: any[] = [];

  if (searchCode) {
    conditions.push("r.referralCode = ?");
    values.push(searchCode);
  }

  if (isActive !== undefined) {
    conditions.push("r.isActive = ?");
    values.push(isActive ? 1 : 0);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows]: any = await pool.query(
    `
    SELECT r.*, u.email AS referrerEmail, u.nickname AS referrerName
    FROM referrals r
    LEFT JOIN users u ON r.referrerId = u.id
    ${whereClause}
    ORDER BY r.${orderBy} ${order}
    LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const [[{ total }]]: any = await pool.query(
    `
    SELECT COUNT(*) as total
    FROM referrals r
    ${whereClause}
    `,
    values
  );

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

export async function getReferralByCode(code: string) {
  const [rows]: any = await pool.query(`SELECT * FROM referrals WHERE referralCode = ?`, [code]);
  return rows.length ? rows[0] : null;
}

export async function getReferralById(id: string) {
  const [rows]: any = await pool.query(`SELECT * FROM referrals WHERE id = ?`, [id]);
  return rows.length ? rows[0] : null;
}

export async function createReferralForUser(
  referrerId: string,
  maxUses: number | null = null,
  bonusId: string | null = null
) {
  const id = uuidv4();
  const referralCode = uuidv4().split("-")[0].toUpperCase();

  await pool.query(
    `INSERT INTO referrals (id, referrerId, referralCode, uses, maxUses, bonusId, isActive, createdAt)
     VALUES (?, ?, ?, 0, ?, ?, 1, NOW())`,
    [id, referrerId, referralCode, maxUses, bonusId]
  );

  return { id, referrerId, referralCode, maxUses, bonusId };
}

export async function updateReferral(
  id: string,
  updates: {
    maxUses?: number | null;
    bonusId?: string | null;
    isActive?: boolean;
  }
) {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.maxUses !== undefined) {
    fields.push("maxUses = ?");
    values.push(updates.maxUses);
  }

  if (updates.bonusId !== undefined) {
    fields.push("bonusId = ?");
    values.push(updates.bonusId);
  }

  if (updates.isActive !== undefined) {
    fields.push("isActive = ?");
    values.push(updates.isActive ? 1 : 0);
  }

  if (fields.length === 0) return { message: "No updates provided" };

  values.push(id);

  const [result]: any = await pool.query(
    `UPDATE referrals SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows
    ? { message: "Referral updated successfully" }
    : { message: "Referral not found or no changes made" };
}

export async function deleteReferral(id: string) {
  const [result]: any = await pool.query(`DELETE FROM referrals WHERE id = ?`, [id]);

  return result.affectedRows
    ? { message: "Referral deleted successfully" }
    : { message: "Referral not found" };
}

/**
 * Get summarized referral statistics
 */
export async function getReferralStats() {
  const [[stats]]: any = await pool.query(`
    SELECT 
      COUNT(*) AS totalReferrals,
      SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeReferrals,
      SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) AS inactiveReferrals,
      SUM(uses) AS totalUses,
      ROUND(AVG(uses), 2) AS avgUsesPerReferral
    FROM referrals
  `);

  // Top referrers by total referral uses
  const [topReferrers]: any = await pool.query(`
    SELECT 
      u.id AS userId,
      u.nickname AS referrerName,
      u.email AS referrerEmail,
      COUNT(r.id) AS totalCodes,
      SUM(r.uses) AS totalUses
    FROM referrals r
    LEFT JOIN users u ON r.referrerId = u.id
    GROUP BY u.id, u.nickname, u.email
    ORDER BY totalUses DESC
    LIMIT 5
  `);

  return {
    ...stats,
    topReferrers,
  };
}
