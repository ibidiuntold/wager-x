import { NextRequest, NextResponse } from 'next/server';
import { getAllNotifications, createNotification, updateNotification, deleteNotification } from '@/services/notificationService';

export async function GET() {
  const notifications = await getAllNotifications();
  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  // Remove status, buttonLink, buttonText if present in client data
  delete data.status;
  delete data.buttonLink;
  delete data.buttonText;
  const result = await createNotification(data);
  return NextResponse.json({ success: true, notificationId: result.id });
}

export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
  const result = await updateNotification(id, data);
  return NextResponse.json({ success: true, result });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
  const result = await deleteNotification(id);
  return NextResponse.json({ success: true, result });
} 