// app/api/webhooks/paystack/route.ts (Webhook handler for real-time updates)
import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const paystackSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle transfer events for withdrawals
    if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const transferData = event.data;
      const transferCode = transferData.transfer_code;
      
      let status: string;
      switch (event.event) {
        case 'transfer.success':
          status = 'completed';
          break;
        case 'transfer.failed':
        case 'transfer.reversed':
          status = 'failed';
          break;
        default:
          status = 'processing';
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Update transaction status
        const [updateResult] = await connection.query(
          'UPDATE transactions SET status = ?, updatedAt = NOW() WHERE providerReference = ? AND type = "withdrawal"',
          [status, transferCode]
        ) as any;

        // If transfer failed and we updated a transaction, refund the user
        if (status === 'failed' && updateResult.affectedRows > 0) {
          const [transactionRows] = await connection.query(
            'SELECT userId, amount FROM transactions WHERE providerReference = ? AND type = "withdrawal"',
            [transferCode]
          ) as any;

          if (transactionRows.length > 0) {
            const { userId, amount } = transactionRows[0];
            await connection.query(
              'UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?',
              [amount, userId]
            );
          }
        }

        await connection.commit();
        console.log(`Webhook processed: ${event.event} for transfer ${transferCode}`);
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}