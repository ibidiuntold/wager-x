import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getFilteredWagers, createWager, updateWager, deleteWager } from '@/services/wagerService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Query parameters
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('pageNumber');
    const slug = searchParams.get('slug') || undefined;
    const wagerContains = searchParams.get('wager_contains') || undefined;
    const category = searchParams.get('category') || undefined;
    const creatorId = searchParams.get('creatorId') || undefined;
    const status = searchParams.get('status') || undefined;

    let limit: number | undefined;
    let pageNumber: number | undefined;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid limit parameter. Must be a positive number.' },
          { status: 400 }
        );
      }
    }

    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        pageNumber = parsedPage;
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid pageNumber parameter. Must be a positive number.' },
          { status: 400 }
        );
      }
    }

    // Get filtered wagers
    const wagers = await getFilteredWagers({
      limit,
      pageNumber,
      slug,
      wagerContains,
      category,
      creatorId,
      status,
    });

    return NextResponse.json({ success: true, wagers: wagers.rows, pagination: wagers.pagination });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.json({ success: false, message: 'Authentication check failed' }, { status: 500 });
  }
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const tokenUserId = token.sub as string;

  const data = await req.json();
  data.creatorId = tokenUserId;
  const result = await createWager(data);
  return NextResponse.json({ success: true, wager: result });
}

export async function PUT(req: NextRequest) {
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.json({ success: false, message: 'Authentication check failed' }, { status: 500 });
  }
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing wager id' }, { status: 400 });
  const result = await updateWager(id, data);
  return NextResponse.json({ success: true, result });
}

export async function DELETE(req: NextRequest) {
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return NextResponse.json({ success: false, message: 'Authentication check failed' }, { status: 500 });
  }
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing wager id' }, { status: 400 });
  const result = await deleteWager(id);
  return NextResponse.json({ success: true, result });
} 