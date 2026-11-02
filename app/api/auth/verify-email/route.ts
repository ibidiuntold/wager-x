import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/token';
import { updateUserByEmail } from '@/services/userService';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, message: 'Invalid token.' }, { status: 400 });
    }

    const decodedToken = verifyToken(token);
    console.log("Decoded token:", decodedToken);

    if (!decodedToken || !decodedToken.email || !decodedToken.id) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 400 });
    }

    const updatedUser = await updateUserByEmail(decodedToken.email, {
      emailVerified: true,
      status: 'active',
      updatedAt: new Date(),
    });

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found or already verified.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}