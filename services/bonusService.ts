// services/bonusService.ts
import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";

export type BonusType = "signup" | "deposit" | "referral" | "custom";
export type BonusTarget = "all" | "new_users" | "selected" | "custom" | "referrals";

export interface CreateBonusData {
  name: string;
  description?: string | null;
  type?: BonusType;
  amount?: number;
  criteria?: any | null; // JSON-serializable criteria object
  target?: BonusTarget;
  isActive?: boolean;
  startDate?: string | null; // ISO string or null
  endDate?: string | null;   // ISO string or null
  creatorId?: string | null;
}

/** ---------------- BONUSES ---------------- **/

/**
 * Get all bonuses (simple list)
 */
// import pool from "@/lib/mysql";
// import { v4 as uuidv4 } from "uuid";

/**
 * Get all bonuses with search and pagination
 */
export async function getAllBonuses({
  search,
  type = "",
  target = "",
  isActive,
  pageNumber = 1,
  limit = 10,
  orderBy = "createdAt",
  order = "DESC",
}: {
  search?: string;
  type?: string;
  target?: string;
  isActive?: boolean;
  pageNumber?: number;
  limit?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
} = {}) {
  const offset = (pageNumber - 1) * limit;
  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push(`(b.name LIKE ? OR b.description LIKE ?)`);
    values.push(`%${search}%`, `%${search}%`);
  }

  if (type && type !== "") {
    conditions.push(`b.type = ?`);
    values.push(type);
  }

  if (target && target !== "") {
    conditions.push(`b.target = ?`);
    values.push(target)
  }

  if (isActive !== undefined) {
    conditions.push(`b.isActive = ?`);
    values.push(isActive ? 1 : 0);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows]: any = await pool.query(
    `
    SELECT b.*
    FROM bonuses b
    ${whereClause}
    ORDER BY b.${orderBy} ${order}
    LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const [[{ total }]]: any = await pool.query(
    `
    SELECT COUNT(*) as total
    FROM bonuses b
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


/**
 * Get a single bonus by id
 */
export async function getBonusById(id: string) {
  const [rows]: any = await pool.query(`SELECT * FROM bonuses WHERE id = ?`, [id]);
  return rows.length ? rows[0] : null;
}

/**
 * Create a new bonus (handles criteria JSON)
 */
export async function createBonus(data: CreateBonusData) {
  const id = uuidv4();
  const {
    name,
    description = null,
    type = "custom",
    amount = 0,
    criteria = null,
    target = "all",
    isActive = true,
    startDate = null,
    endDate = null,
    creatorId = null,
  } = data;

  const criteriaStr = criteria ? JSON.stringify(criteria) : null;

  await pool.query(
    `INSERT INTO bonuses
      (id, name, description, type, amount, criteria, target, isActive, startDate, endDate, creatorId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      name,
      description,
      type,
      amount,
      criteriaStr,
      target,
      isActive ? 1 : 0,
      startDate,
      endDate,
      creatorId,
    ]
  );

  // Return the created bonus (with parsed criteria)
  return {
    id,
    name,
    description,
    type,
    amount,
    criteria,
    target,
    isActive,
    startDate,
    endDate,
    creatorId,
  };
}

/**
 * Update a bonus (handles criteria object -> JSON)
 */
export async function updateBonus(id: string, updates: Partial<CreateBonusData>) {
  if (!updates || Object.keys(updates).length === 0) return;

  const fields: string[] = [];
  const values: any[] = [];

  for (const [k, v] of Object.entries(updates)) {
    // handle criteria specially (serialize)
    if (k === "criteria") {
      fields.push("criteria = ?");
      values.push(v ? JSON.stringify(v) : null);
      continue;
    }

    // convert boolean isActive to 0/1
    if (k === "isActive") {
      fields.push("isActive = ?");
      values.push(v ? 1 : 0);
      continue;
    }

    // allow direct mapping for known columns (name, description, type, amount, target, startDate, endDate, creatorId)
    fields.push(`${k} = ?`);
    values.push(v);
  }

  // set updatedAt
  fields.push("updatedAt = NOW()");

  const sql = `UPDATE bonuses SET ${fields.join(", ")} WHERE id = ?`;
  await pool.query(sql, [...values, id]);
}

/**
 * Delete a bonus
 */
export async function deleteBonus(id: string) {
  await pool.query(`DELETE FROM bonuses WHERE id = ?`, [id]);
}

/** ---------------- BONUS_USERS (read) ---------------- **/

export async function getBonusUsersByBonusId(bonusId: string) {
  const [rows]: any = await pool.query(
    `SELECT bu.*, u.nickname, u.email
     FROM bonus_users bu
     JOIN users u ON bu.userId = u.id
     WHERE bu.bonusId = ?
     ORDER BY bu.createdAt DESC`,
    [bonusId]
  );  
  return rows;
}
