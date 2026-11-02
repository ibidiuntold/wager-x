import { NextResponse } from 'next/server';
import { getSettledUsersBySettlementId } from '@/services/settlementService';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id: settlementId } = params;

    if (!settlementId) {
      return NextResponse.json(
        { success: false, message: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    const data = await getSettledUsersBySettlementId(settlementId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching settled users by settlementId:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
