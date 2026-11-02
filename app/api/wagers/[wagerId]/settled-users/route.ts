import { NextResponse } from 'next/server';
import { getSettledUsersByWagerId } from '@/services/settlementService';

interface Params {
  params: { wagerId: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { wagerId } = params;

    if (!wagerId) {
      return NextResponse.json(
        { success: false, message: 'Wager ID is required' },
        { status: 400 }
      );
    }

    const data = await getSettledUsersByWagerId(wagerId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching settled users by wagerId:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
