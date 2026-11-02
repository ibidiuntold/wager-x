import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { 
  getWagerParticipants, 
  hasUserParticipated, 
  createWagerParticipant,
} from '@/services/wagerParticipantService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wagerId = searchParams.get('wagerId');

    if (!wagerId) {
      return NextResponse.json(
        { success: false, message: 'Wager ID is required' },
        { status: 400 }
      );
    }

    const participants = await getWagerParticipants(wagerId);

    return NextResponse.json({ 
      success: true, 
      participants 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Authentication check failed' },
      { status: 500 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Identity always comes from the verified token, never the request body
  const userId = token.sub as string;

  try {
    const { wagerId, optionSelected, amount } = await req.json();

    if (!wagerId || !optionSelected || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already participated in this wager
    const hasParticipated = await hasUserParticipated(wagerId, userId);

    if (hasParticipated) {
      return NextResponse.json(
        { success: false, message: 'User has already participated in this wager' },
        { status: 400 }
      );
    }

    // Create new participant (balance check handled inside the service)
    const result = await createWagerParticipant({
      wagerId,
      userId,
      optionSelected,
      amount
    });

    return NextResponse.json({ 
      success: true, 
      participant: result 
    });
  } catch (error: any) {
    console.error('API Error:', error);

    const message = error?.message || 'Failed to place bet';

    // Return 402 for insufficient balance so the client can give a specific message
    if (message === 'Insufficient balance') {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
} 