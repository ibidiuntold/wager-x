// app/api/admin/auth/route.ts
import { NextResponse } from 'next/server';
import { firebase_app_admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'No ID token provided' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const auth = getAuth(firebase_app_admin);
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if user is admin or manager in Firestore
    const db = getFirestore(firebase_app_admin);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Unauthorized: User does not have admin permissions' },
        { status: 403 }
      );
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Return success with cookie
    return NextResponse.json(
      { success: true, role: userData.role },
      {
        status: 200,
        headers: {
          'Set-Cookie': `__session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${expiresIn}`
        }
      }
    );
  } catch (error: any) {
    console.error('Admin auth error:', error);
    
    // Handle quota exceeded error
    if (error.code === 8 && error.details === 'Quota exceeded.') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable: Daily quota exceeded. Please try again tomorrow.' },
        { status: 503 }
      );
    }
    
    // Handle token expiration
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Session expired. Please sign in again.' },
        { status: 401 }
      );
    }
    
    // Default error message
    return NextResponse.json(
      { error: error.message || 'Authentication failed. Please try again.' },
      { status: 401 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookies = request.headers.get('cookie');
    const sessionCookie = cookies?.split('; ').find(c => c.startsWith('__session='))?.split('=')[1];

    if (!sessionCookie) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    // Verify the session cookie
    const auth = getAuth(firebase_app_admin);
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Check user role in Firestore
    const db = getFirestore(firebase_app_admin);
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
      return NextResponse.json({ 
        isValid: false,
        error: 'User does not have admin permissions'
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      isValid: true, 
      uid: decodedClaims.uid,
      role: userData.role
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    
    if (error.code === 8 && error.details === 'Quota exceeded.') {
      return NextResponse.json(
        { 
          isValid: false,
          error: 'Service temporarily unavailable: Daily quota exceeded. Please try again tomorrow.'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json({ isValid: false }, { status: 401 });
  }
}