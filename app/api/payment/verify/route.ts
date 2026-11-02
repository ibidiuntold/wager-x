// app/api/payment/verify/route.ts (Updated to handle withdrawals)
import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

type VerifyResponse = {
  success: boolean;
  amount?: number;
  error?: string;
  message?: string;
};

export async function POST(req: Request) {
  const body = await req.json();
  const { reference, userId, processorId, type = 'deposit' } = body as {
    reference: string;
    userId: string;
    processorId?: string;
    type?: 'deposit' | 'withdrawal';
  };

  if (!reference || !userId) {
    return NextResponse.json<VerifyResponse>(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const paystackSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json<VerifyResponse>(
        { success: false, error: 'Missing Paystack secret key' },
        { status: 500 }
      );
    }

    let verificationUrl: string;
    let updateQuery: string;
    let updateParams: any[];

    if (type === 'withdrawal') {
      // Verify transfer status for withdrawals
      verificationUrl = `https://api.paystack.co/transfer/verify/${reference}`;
      
      const response = await fetch(verificationUrl, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Paystack transfer verification error:', text);
        return NextResponse.json<VerifyResponse>(
          { success: false, error: 'Failed to verify transfer status' },
          { status: response.status }
        );
      }

      const verificationData = await response.json();

      if (!verificationData?.data) {
        return NextResponse.json<VerifyResponse>(
          { success: false, error: 'Transfer verification failed' },
          { status: 400 }
        );
      }

      const transferStatus = verificationData.data.status;
      let dbStatus: string;

      // Map Paystack transfer status to our database status
      switch (transferStatus) {
        case 'success':
          dbStatus = 'completed';
          break;
        case 'failed':
        case 'reversed':
          dbStatus = 'failed';
          break;
        case 'pending':
        case 'otp':
          dbStatus = 'processing';
          break;
        default:
          dbStatus = 'processing';
      }

      // Update withdrawal transaction status
      updateQuery = `
        UPDATE transactions 
        SET status = ?, updatedAt = NOW() 
        WHERE providerReference = ? AND userId = ? AND type = 'withdrawal'
      `;
      updateParams = [dbStatus, reference, userId];

      // If withdrawal failed, refund the user's balance
      if (dbStatus === 'failed') {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // Get transaction details
          const [transactionRows] = await connection.query(
            'SELECT amount FROM transactions WHERE providerReference = ? AND userId = ? AND type = "withdrawal"',
            [reference, userId]
          ) as any;

          if (transactionRows.length > 0) {
            const refundAmount = transactionRows[0].amount;
            
            // Update transaction status
            await connection.query(updateQuery, updateParams);
            
            // Refund user balance
            await connection.query(
              'UPDATE users SET balance = balance + ? WHERE id = ?',
              [refundAmount, userId]
            );
          }

          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
      } else {
        // Just update transaction status
        await pool.query(updateQuery, updateParams);
      }

      return NextResponse.json<VerifyResponse>({ 
        success: true, 
        message: `Withdrawal ${dbStatus}`,
        amount: verificationData.data.amount ? Number(verificationData.data.amount) / 100 : 0
      });

    } else {
      // Handle deposit verification (existing logic)
      const transactionId = uuidv4();
      verificationUrl = `https://api.paystack.co/transaction/verify/${reference}`;

      const response = await fetch(verificationUrl, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Paystack API error:', text);
        return NextResponse.json<VerifyResponse>(
          { success: false, error: 'Failed to reach Paystack API' },
          { status: response.status }
        );
      }

      const verificationData = await response.json();

      if (!verificationData?.data || verificationData.data.status !== 'success') {
        return NextResponse.json<VerifyResponse>(
          { success: false, error: 'Payment verification failed' },
          { status: 400 }
        );
      }

      const amount = Number(verificationData.data.amount) / 100;

      // Save deposit transaction
      const insertTransactionSql = `
        INSERT INTO transactions (id, userId, reference, amount, status, type, provider, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      await pool.query(insertTransactionSql, [
        transactionId,
        userId,
        reference,
        amount,
        'completed',
        'deposit',
        processorId || 'paystack',
      ]);

      // Update user balance
      const updateBalanceSql = `
        UPDATE users SET balance = balance + ? WHERE id = ?
      `;
      await pool.query(updateBalanceSql, [amount, userId]);

      return NextResponse.json<VerifyResponse>({ success: true, amount });
    }

  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json<VerifyResponse>(
      { success: false, error: 'Server error during verification' },
      { status: 500 }
    );
  }
}