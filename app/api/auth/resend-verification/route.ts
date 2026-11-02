import { NextRequest, NextResponse } from 'next/server';
import { VerifyEmail } from '@/services/emailService';
import { getUserByEmail } from '@/services/userService';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    await VerifyEmail(email);

    return NextResponse.json({ success: true, message: 'Verification email sent successfully!' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    // Handle specific error from the email service, like cooldowns
    if (error.message.includes('wait before requesting')) {
        return NextResponse.json({ success: false, message: error.message }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: 'Failed to send verification email.' }, { status: 500 });
  }
}