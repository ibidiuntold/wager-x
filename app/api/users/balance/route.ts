// app/api/user/balance/route.ts

import { NextResponse } from 'next/server';
import { getUserBalance } from '@/services/userService';

/**
 * Handles GET requests to fetch a user's wallet and bonus balance.
 * * @param {Request} req The incoming request object.
 * @returns {Promise<NextResponse>} A JSON response with the user's balance or an error message.
 */
export async function GET(req: Request) {
  try {
    // Parse the URL to get the search parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Simple validation without zod
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid user ID provided.'
      }, { status: 400 });
    }

    // Call the service function to get the user's balance data
    const user = await getUserBalance(userId);

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found.' 
      }, { status: 404 });
    }

    // Return the user's balance data in a successful response
    const walletBalance = Number(user.walletBalance) || 0;
    const walletBonus  = Number((user as any).walletBonus) || 0;
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        walletBalance,
        walletBonus,
        totalBalance: walletBalance + walletBonus,
        email: user.email
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred.' 
    }, { status: 500 });
  }
}
