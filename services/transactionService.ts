// services/transactionService.ts
import pool from "@/lib/mysql";
import { v4 as uuidv4 } from "uuid";
import { RowDataPacket } from "mysql2";

interface AccountDetails {
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
}

interface CreateWithdrawalTransactionParams {
  userId: string;
  amount: number;
  netAmount: number;
  processingFee: number;
  reference: string;
  providerReference: string;
  accountDetails: AccountDetails;
  recipientCode: string;
  type: "withdrawal";
  status: "processing" | "completed" | "failed";
  provider: "paystack" | "flutterwave" | "opay";
}

class TransactionService {
  // ✅ Create withdrawal transaction & deduct user balance
  async createWithdrawalTransaction(params: CreateWithdrawalTransactionParams) {
    try {
      const transactionId = uuidv4();

      const sql = `
        INSERT INTO transactions (
          id, userId, reference, providerReference, amount, netAmount,
          processingFee, status, type, provider, accountNumber,
          bankCode, bankName, accountName, recipientCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await pool.query(sql, [
        transactionId,
        params.userId,
        params.reference,
        params.providerReference,
        params.amount,
        params.netAmount,
        params.processingFee,
        params.status,
        params.type,
        params.provider,
        params.accountDetails.accountNumber,
        params.accountDetails.bankCode,
        params.accountDetails.bankName,
        params.accountDetails.accountName,
        params.recipientCode,
      ]);

      // ✅ Deduct balance after successful transaction insert
      await pool.query(`UPDATE users SET balance = balance - ? WHERE id = ?`, [
        params.amount,
        params.userId,
      ]);

      return { success: true, transactionId };
    } catch (error) {
      console.error("Transaction DB error:", error);
      return { success: false, error: "DB insert failed" };
    }
  }
}

export const transactionService = new TransactionService();


// =========================================================
// ✅ Utility functions for admin & internal usage
// =========================================================

export async function getTransactionById(id: string) {
  const [rows] = await pool.query(
    "SELECT * FROM transactions WHERE id = ?",
    [id]
  );
  return Array.isArray(rows) ? rows[0] : null;
}

interface GetAllTransactionsOptions {
  status?: string;
  provider?: string;
  type?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  limit?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
}

/**
 * Get all transactions with filtering, search, sorting, and pagination
 */
export async function getAllTransactions(options: GetAllTransactionsOptions = {}) {
  const {
    status,
    provider,
    type,
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
    conditions.push("t.status = ?");
    values.push(status);
  }

  if (provider) {
    conditions.push("t.provider = ?");
    values.push(provider);
  }

  if (type) {
    conditions.push("t.type = ?");
    values.push(type);
  }

  if (searchTerm) {
    conditions.push(`
      (t.bankName LIKE ? 
      OR t.accountName LIKE ? 
      OR t.accountNumber LIKE ?)
    `);
    values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (startDate && endDate) {
    conditions.push("t.createdAt BETWEEN ? AND ?");
    values.push(startDate, endDate);
  } else if (startDate) {
    conditions.push("t.createdAt >= ?");
    values.push(startDate);
  } else if (endDate) {
    conditions.push("t.createdAt <= ?");
    values.push(endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (pageNumber - 1) * limit;

  const query = `
    SELECT 
      t.*, 
      u.nickname AS userName
    FROM transactions t
    LEFT JOIN users u ON t.userId = u.id
    ${whereClause}
    ORDER BY t.${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;

  const [rows]: any = await pool.query(query, [...values, limit, offset]);

  // Total count for pagination
  const [countRows]: any = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM transactions t
      LEFT JOIN users u ON t.userId = u.id
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


export async function createTransaction(data: any) {
  const {
    accountName,
    accountNumber,
    bankCode,
    bankName,
    provider,
    reference,
    status,
    type,
    userId,
  } = data;

  const id = uuidv4();

  const [result] = await pool.query(
    `INSERT INTO transactions 
    (id, accountName, accountNumber, bankCode, bankName, provider, reference, status, type, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      accountName,
      accountNumber,
      bankCode,
      bankName,
      provider,
      reference,
      status,
      type,
      userId,
    ]
  );

  return { ...result, id };
}

export async function updateTransaction(id: string, data: any) {
  const fields = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(data);
  if (!fields) return null;

  const [result] = await pool.query(
    `UPDATE transactions SET ${fields}, updatedAt = NOW() WHERE id = ?`,
    [...values, id]
  );
  return result;
}

export async function deleteTransaction(id: string) {
  const [result] = await pool.query(
    "DELETE FROM transactions WHERE id = ?",
    [id]
  );
  return result;
}

export async function getTransactionsStats() {
  try {
    // ✅ Total transactions
    const [totalResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalTransactions FROM transactions`
    );

    // ✅ Total deposits
    const [depositResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalDeposits, 
              COALESCE(SUM(amount),0) as totalDepositAmount
       FROM transactions
       WHERE type = 'deposit'`
    );

    // ✅ Total withdrawals
    const [withdrawalResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalWithdrawals, 
              COALESCE(SUM(amount),0) as totalWithdrawalAmount,
              COALESCE(SUM(processingFee),0) as totalWithdrawalFees
       FROM transactions
       WHERE type = 'withdrawal'`
    );

    // ✅ Failed transactions
    const [failedResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalFailed 
       FROM transactions
       WHERE status = 'failed'`
    );

    // ✅ Successful transactions
    const [successResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as totalSuccessful 
       FROM transactions
       WHERE status = 'completed'`
    );

    return {
      totalTransactions: totalResult[0]?.totalTransactions || 0,
      totalDeposits: depositResult[0]?.totalDeposits || 0,
      totalDepositAmount: depositResult[0]?.totalDepositAmount || 0,
      totalWithdrawals: withdrawalResult[0]?.totalWithdrawals || 0,
      totalWithdrawalAmount: withdrawalResult[0]?.totalWithdrawalAmount || 0,
      totalWithdrawalFees: withdrawalResult[0]?.totalWithdrawalFees || 0,
      totalFailed: failedResult[0]?.totalFailed || 0,
      totalSuccessful: successResult[0]?.totalSuccessful || 0,
    };
  } catch (error) {
    console.error('Error fetching transactions stats:', error);
    throw new Error('Database query failed');
  }
}