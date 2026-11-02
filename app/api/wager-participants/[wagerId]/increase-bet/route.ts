import { NextResponse } from 'next/server';
import { increaseParticipantBetService } from '@/services/wagerParticipantService';

export async function POST(
  req: Request,
  { params }: { params: { wagerId: string } }
) {
  const wagerId = params.wagerId;
  try {
    const { participantId, addAmount, userId } = await req.json();

    if (!participantId || !addAmount || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await increaseParticipantBetService(
      wagerId,
      participantId,
      Number(addAmount),
      userId
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to increase participant bet' },
      { status: 500 }
    );
  }
}
