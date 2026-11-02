import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";
import { getUserById } from "@/services/userService";

export interface Reply {
  id: string;
  commentId: string;
  wagerId: string;
  userId: string;
  reply: string;
  createdAt?: Date;
  updatedAt?: Date;
  user?: any; // hydrated user object
}

export const replyService = {
  async createReply(data: Omit<Reply, "id" | "createdAt" | "updatedAt" | "user">) {
    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    const sql = `
      INSERT INTO replies (id, commentId, wagerId, userId, reply, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      id,
      data.commentId,
      data.wagerId,
      data.userId,
      data.reply,
      createdAt,
      updatedAt,
    ]);

    // hydrate user
    const user = await getUserById(data.userId);

    return { id, ...data, createdAt, updatedAt, user };
  },

  async getReplies(
    filters?: { commentId?: string; userId?: string; wagerId?: string },
    pagination?: { limit?: number; offset?: number }
  ): Promise<Reply[]> {
    let sql = `SELECT * FROM replies`;
    const values: (string | number)[] = [];
    const conditions: string[] = [];

    if (filters?.commentId) {
      conditions.push(`commentId = ?`);
      values.push(filters.commentId);
    }
    if (filters?.userId) {
      conditions.push(`userId = ?`);
      values.push(filters.userId);
    }
    if (filters?.wagerId) {
      conditions.push(`wagerId = ?`);
      values.push(filters.wagerId);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(" AND ");
    }

    sql += ` ORDER BY createdAt DESC`;

    // Pagination
    if (pagination?.limit) {
      sql += ` LIMIT ?`;
      values.push(pagination.limit);

      if (pagination?.offset) {
        sql += ` OFFSET ?`;
        values.push(pagination.offset);
      }
    }

    const [rows]: any[] = await pool.query(sql, values);

    // hydrate users for each reply
    const replies: Reply[] = await Promise.all(
      rows.map(async (r: any) => {
        const user = await getUserById(r.userId);
        return {
          ...r, user: user
            ? {
              id: user.id,
              email: user.email,
              firstname: user.firstName,
              lastname: user.lastName,
              avatarUrl: user.avatarUrl,
              nickname: user.nickname,
            }
            : null
        };
      })
    );

    console.log('Fetched replies:', replies);

    return replies;
  },

  async getReplyById(replyId: string): Promise<Reply | null> {
    const [rows]: any = await pool.query(`SELECT * FROM replies WHERE id = ?`, [replyId]);
    if (!rows[0]) return null;

    const reply = rows[0];
    const user = await getUserById(reply.userId);

    return { ...reply, user };
  },

  async updateReply(replyId: string, reply: string) {
    const updatedAt = new Date();
    await pool.query(
      `UPDATE replies SET reply = ?, updatedAt = ? WHERE id = ?`,
      [reply, updatedAt, replyId]
    );
    return this.getReplyById(replyId);
  },

  async deleteReply(replyId: string) {
    await pool.query(`DELETE FROM replies WHERE id = ?`, [replyId]);
    return { success: true };
  },
};
