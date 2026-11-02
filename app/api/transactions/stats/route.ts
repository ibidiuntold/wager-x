import { NextResponse } from 'next/server';
import { getTransactionsStats } from '@/services/transactionService';

export async function GET() {
  try {
    const stats = await getTransactionsStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error in /api/transactions/stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions stats' },
      { status: 500 }
    );
  }
}
