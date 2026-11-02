import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscribers, createSubscriber, updateSubscriber, deleteSubscriber } from '@/services/subscriberService';

export async function GET() {
  const subscribers = await getAllSubscribers();
  return NextResponse.json({ subscribers });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const result = await createSubscriber(data);
  return NextResponse.json({ success: true, subscriberId: result.insertId });
}

export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing subscriber id' }, { status: 400 });
  const result = await updateSubscriber(id, data);
  return NextResponse.json({ success: true, result });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing subscriber id' }, { status: 400 });
  const result = await deleteSubscriber(id);
  return NextResponse.json({ success: true, result });
} 