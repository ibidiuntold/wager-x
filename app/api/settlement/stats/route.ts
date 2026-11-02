// app/api/settlement/stats/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
  try {
    const [[stats]]: any = await pool.query(`
      SELECT
        COUNT(*) AS totalSettlements,
        SUM(totalAmount) AS totalAmount,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedCount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedCount
      FROM settlements
    `);

    return NextResponse.json({
      success: true,
      data: {
        totalSettlements: stats.totalSettlements || 0,
        totalAmount: stats.totalAmount || 0,
        completedCount: stats.completedCount || 0,
        pendingCount: stats.pendingCount || 0,
        failedCount: stats.failedCount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching settlement stats:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
