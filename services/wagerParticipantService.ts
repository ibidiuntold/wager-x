import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import { getWagerById } from "@/services/wagerService";
import { getUserBalance } from './userService';

export interface WagerParticipant {
  id: string;
  wagerId: string;
  userId: string;
  optionSelected: string;
  amount: number;
  createdAt: Date;
  userName?: string;
  userEmail?: string;
}

export interface CreateParticipantData {
  wagerId: string;
  userId: string;
  optionSelected: string;
  amount: number;
}

/**
 * Get all participants for a specific wager
 * @param wagerId - The ID of the wager
 * @returns Promise<WagerParticipant[]> - Array of participants with user details
 */
export async function getWagerParticipants(wagerId: string): Promise<WagerParticipant[]> {
  try {
    const [rows] = await pool.query(`
       SELECT 
         wp.id AS participantId,
         wp.userId,
         wp.wagerId,
         wp.gameSessionId,
         wp.optionSelected,
         wp.amount AS wagerAmount,
         wp.joinedAt AS participantCreatedAt,
         u.id AS userId,
         u.nickname AS userName,
         u.email AS userEmail
       FROM wager_participants AS wp
       LEFT JOIN users AS u ON wp.userId = u.id
       WHERE wp.wagerId = ?
       ORDER BY wp.joinedAt DESC
    `, [wagerId]);

    return rows as WagerParticipant[];
  } catch (error) {
    console.error('Error fetching wager participants:', error);
    throw new Error('Failed to retrieve wager participants from the database.');
  }
}

/**
 * Check if a user has already participated in a wager
 * @param wagerId - The ID of the wager
 * @param userId - The ID of the user
 * @returns Promise<boolean> - True if user has already participated
 */
export async function hasUserParticipated(wagerId: string, userId: string): Promise<boolean> {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM wager_participants WHERE wagerId = ? AND userId = ?',
      [wagerId, userId]
    );

    const result = rows as any[];
    return result[0]?.count > 0;
  } catch (error) {
    console.error('Error checking user participation:', error);
    throw new Error('Failed to check user participation status.');
  }
}

/**
 * Create a new wager participant (atomic transaction with balance check)
 */
export async function createWagerParticipant(data: CreateParticipantData): Promise<any> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ForUpdateLock: lock the user row and read the current balance atomically
    const [balanceRows] = await conn.query(
      'SELECT balance FROM users WHERE id = ? FOR UPDATE',
      [data.userId]
    );
    const balanceData = (balanceRows as any[])[0];
    if (!balanceData || Number(balanceData.balance) < data.amount) {
      await conn.rollback();
      throw new Error('Insufficient balance');
    }

    // Lock and read the wager row to determine wagerType and option odds
    const [wagerRows] = await conn.query(
      'SELECT wagerType, options FROM wagers WHERE id = ? FOR UPDATE',
      [data.wagerId]
    );
    const wagerRow = (wagerRows as any[])[0];
    const wagerType: 'p2p' | 'event' = wagerRow?.wagerType ?? 'p2p';
    const parsedOptions: Array<{ name: string; odds?: number }> = (() => {
      try {
        const raw = wagerRow?.options;
        return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
      } catch { return []; }
    })();

    // Determine oddsAtBet: 1.00 for p2p, matched option odds for event
    let oddsAtBet = 1.00;
    if (wagerType === 'event') {
      const matched = parsedOptions.find(o => o.name === data.optionSelected);
      if (matched?.odds != null && matched.odds > 0) {
        oddsAtBet = matched.odds;
      } else {
        console.warn(
          `[createWagerParticipant] EventWager ${data.wagerId}: odds absent for option ` +
          `"${data.optionSelected}" — defaulting oddsAtBet to 1.00`
        );
      }
    }

    const participantId = uuidv4();

    // Insert new participant (with oddsAtBet)
    const [result] = await conn.query(
      'INSERT INTO wager_participants (id, wagerId, userId, optionSelected, amount, oddsAtBet, joinedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [participantId, data.wagerId, data.userId, data.optionSelected, data.amount, oddsAtBet]
    );

    // Update wager total pool
    await conn.query(
      'UPDATE wagers SET totalPool = totalPool + ? WHERE id = ?',
      [data.amount, data.wagerId]
    );

    // Deduct from user balance
    await conn.query(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [data.amount, data.userId]
    );

    // Insert WagerDebit transaction record (Requirement 2.1)
    const transactionId = uuidv4();
    const reference = `wager_debit_${data.wagerId}_${data.userId}_${Date.now()}`;
    await conn.query(
      `INSERT INTO transactions (id, userId, reference, amount, netAmount, processingFee, status, type, provider, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionId,
        data.userId,
        reference,
        data.amount,
        data.amount,
        0,
        'completed',
        'wager_debit',
        'internal',
      ]
    );

    await conn.commit();
    return { ...result, participantId };
  } catch (error) {
    await conn.rollback();
    console.error('Error creating wager participant:', error);
    throw error;
  } finally {
    conn.release();
  }
}

type UserBalanceData = {
  id: string;
  walletBalance: number;
  email?: string
};

export async function increaseParticipantBetService(
  wagerId: string,
  participantId: string,
  addAmount: number,
  userId: string
): Promise<{ newAmount: number }> {
  try {
    const wager = await getWagerById(wagerId);
    if (!wager) throw new Error("Wager not found");

    const userBalance: UserBalanceData | null = await getUserBalance(userId);
    if (!userBalance) throw new Error("User not found");
    if (Number(userBalance.walletBalance) < Number(addAmount)) {
      throw new Error("Insufficient wallet balance");
    }

    const [currentRows] = await pool.query(
      "SELECT amount FROM wager_participants WHERE id = ? AND wagerId = ?",
      [participantId, wagerId]
    );
    const currentData = (currentRows as any[])[0];
    if (!currentData) throw new Error("Participant not found in this wager");

    const newAmount = Number(currentData.amount) + addAmount;

    // 🔹 Execute updates in sequence
    await pool.query(
      "UPDATE wager_participants SET amount = ? WHERE id = ?",
      [newAmount, participantId]
    );

    await pool.query(
      "UPDATE wagers SET totalPool = totalPool + ? WHERE id = ?",
      [addAmount, wagerId]
    );

    await pool.query(
      "UPDATE users SET balance = balance - ? WHERE id = ?",
      [addAmount, userId]
    );

    return { newAmount };
  } catch (error) {
    console.error("Error in increaseParticipantBetService:", error);
    throw error;
  }
}

/**
 * Cashout a participant (with 20% fee)
 */
export async function cashout(
  wagerId: string,
  participantId: string
): Promise<{ cashoutAmount: number; fee: number; wagerId: string }> {
  try {
    const wager = await getWagerById(wagerId);
    if (!wager) throw new Error("Wager not found");

    const [currentRows] = await pool.query(
      "SELECT amount, userId FROM wager_participants WHERE id = ? AND wagerId = ?",
      [participantId, wagerId]
    );
    const currentData = (currentRows as any[])[0];
    if (!currentData) throw new Error("Participant not found in this wager");

    const fee = 0.2;
    const cashoutAmount = Math.floor(Number(currentData.amount) * (1 - fee));

    // 🔹 Execute updates in sequence
    await pool.query(
      "DELETE FROM wager_participants WHERE id = ? AND wagerId = ?",
      [participantId, wagerId]
    );

    await pool.query(
      "UPDATE wagers SET totalPool = totalPool - ? WHERE id = ?",
      [currentData.amount, wagerId]
    );

    await pool.query(
      "UPDATE users SET balance = balance + ? WHERE id = ?",
      [cashoutAmount, currentData.userId]
    );

    return { cashoutAmount, fee, wagerId };
  } catch (error: any) {
    console.error("Error cashing out participant:", error);
    throw new Error(error.message || "Failed to cashout participant.");
  }
}


/**
 * Update a participant's bet amount
 * @param participantId - The ID of the participant
 * @param newAmount - The new bet amount
 * @returns Promise<any> - Database result
 */
export async function updateParticipantAmount(participantId: string, newAmount: number): Promise<any> {
  try {
    // Get current amount to calculate difference
    const [currentRows] = await pool.query(
      'SELECT amount, wagerId FROM wager_participants WHERE id = ?',
      [participantId]
    );

    const currentData = (currentRows as any[])[0];
    if (!currentData) {
      throw new Error('Participant not found');
    }

    const amountDifference = newAmount - currentData.amount;

    // Update participant amount
    const [result] = await pool.query(
      'UPDATE wager_participants SET amount = ? WHERE id = ?',
      [newAmount, participantId]
    );

    // Update wager total pool with the difference
    if (amountDifference !== 0) {
      await pool.query(
        'UPDATE wagers SET totalPool = totalPool + ? WHERE id = ?',
        [amountDifference, currentData.wagerId]
      );
    }

    return result;
  } catch (error) {
    console.error('Error updating participant amount:', error);
    throw new Error('Failed to update participant amount.');
  }
}

/**
 * Remove a participant from a wager (cashout)
 * @param participantId - The ID of the participant
 * @returns Promise<{ amount: number, wagerId: string }> - Amount refunded and wager ID
 */
export async function removeParticipant(participantId: string): Promise<{ amount: number, wagerId: string }> {
  try {
    // Get participant details before deletion
    const [currentRows] = await pool.query(
      'SELECT amount, wagerId FROM wager_participants WHERE id = ?',
      [participantId]
    );

    const currentData = (currentRows as any[])[0];
    if (!currentData) {
      throw new Error('Participant not found');
    }

    // Delete participant
    await pool.query(
      'DELETE FROM wager_participants WHERE id = ?',
      [participantId]
    );

    // Update wager total pool by subtracting the amount
    await pool.query(
      'UPDATE wagers SET totalPool = totalPool - ? WHERE id = ?',
      [currentData.amount, currentData.wagerId]
    );

    return {
      amount: currentData.amount,
      wagerId: currentData.wagerId
    };
  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant.');
  }
}
