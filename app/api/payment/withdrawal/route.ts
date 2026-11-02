// app/api/transactions/withdrawal/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

interface WithdrawalTransactionRequest {
  userId: string;
  amount: number;
  netAmount: number;
  processingFee: number;
  reference: string;
  providerReference: string;
  accountDetails: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
  };
  recipientCode: string;
  type: 'withdrawal';
  status: 'processing';
  provider: 'paystack';
}

export async function POST(req: Request) {
  try {
    const body: WithdrawalTransactionRequest = await req.json();
    const {
      userId,
      amount,
      netAmount,
      processingFee,
      reference,
      providerReference,
      accountDetails,
      recipientCode,
      type,
      status,
      provider
    } = body;

    if (!userId || !amount || !reference || !providerReference) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create transaction ID
      const transactionId = uuidv4();

      // 1. Insert transaction record
      const insertTransactionSql = `
        INSERT INTO transactions (
          id, userId, reference, providerReference, amount, netAmount, 
          processingFee, status, type, provider, accountNumber, 
          bankCode, bankName, accountName, recipientCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await connection.query(insertTransactionSql, [
        transactionId,
        userId,
        reference,
        providerReference,
        amount,
        netAmount,
        processingFee,
        status,
        type,
        provider,
        accountDetails.accountNumber,
        accountDetails.bankCode,
        accountDetails.bankName,
        accountDetails.accountName,
        recipientCode
      ]);

      // 2. Update user balance (deduct the full amount)
      const updateBalanceSql = `
        UPDATE users 
        SET balance = balance - ? 
        WHERE id = ?
      `;

      const [updateResult] = await connection.query(updateBalanceSql, [
        amount,
        userId,
        amount
      ]) as any;

      if (updateResult.affectedRows === 0) {
        throw new Error('Insufficient balance or user not found');
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        transactionId,
        message: 'Withdrawal transaction created successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create withdrawal transaction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Server error'
      },
      { status: 500 }
    );
  }
}