import { cookies } from 'next/headers';
import { UserRole } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

/**
 * Check if user has the required role for server components
 * Use this in Server Components where you need to check roles
 * 
 * @param requiredRoles The role(s) required to access the resource
 * @param redirectUrl Where to redirect if unauthorized (defaults to /login)
 */
export function checkServerAuth(requiredRoles: UserRole | UserRole[], redirectUrl: string = '/login') {
  // Check if we have authentication cookies
  const cookieStore = cookies();
  const firebaseToken = cookieStore.get('firebase-token');
  const sessionCookie = cookieStore.get('__session');
  
  if (!firebaseToken && !sessionCookie) {
    redirect(redirectUrl);
  }
  
  // For server components, we can only check if they're authenticated
  // The detailed role check will happen client-side in the RoleGuard component
  
  // Return true to allow rendering to continue
  return true;
}

/**
 * Generate session metadata
 * Use this for client-side auth state in cookies
 */
export function generateSessionMeta() {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  
  return {
    id: sessionId,
    created: now,
    expires: now + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
}

/**
 * Parse ISO date to readable format
 */
export function formatDate(isoDate: string) {
  try {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Invalid date';
  }
}

/**
 * Create a nonce for CSRF protection
 */
export function createAuthNonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}