import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/token';
import { hash } from 'bcryptjs';
import pool from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify the JWT and extract email
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10);

    // Update the user's password in MySQL
    const [result]: any = await pool.query(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE email = ?',
      [hashedPassword, decoded.email]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'No account found for this reset link.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Password updated successfully. You can now log in.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
