import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Always return success to avoid revealing whether an email exists
    try {
      await sendPasswordResetEmail(email);
    } catch (err: any) {
      // Only surface rate-limit errors to the client
      if (err.message?.includes('Please wait')) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      // Swallow "user not found" silently for security
      console.error('Password reset email error:', err.message);
    }

    return NextResponse.json(
      { message: 'If an account exists for that email, a reset link has been sent.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password reset route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
