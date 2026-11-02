import { NextRequest, NextResponse } from 'next/server';
import { getUserParticipatedWagers } from '@/services/wagerService';

/**
 * Handles GET requests to fetch wagers a user has participated in.
 *
 * This API endpoint requires a 'userId' query parameter.
 * It also accepts an optional 'status' parameter to filter by wager status.
 */
export async function GET(req: NextRequest) {
  try {
    // Extract the search parameters from the request URL.
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as 'open' | 'closed' | undefined;

    // Validate that the userId parameter is provided.
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId parameter.' },
        { status: 400 } // Bad Request
      );
    }

    // Call the service function to get the user's wagers.
    const wagers = await getUserParticipatedWagers(userId, status);

    // Return the list of wagers in a JSON response.
    return NextResponse.json({ success: true, wagers });
  } catch (error) {
    // Log the error for debugging and return a 500 status.
    console.error('API Error fetching user wagers:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.', error: (error as Error).message },
      { status: 500 }
    );
  }
}