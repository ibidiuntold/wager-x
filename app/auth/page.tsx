'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');
  const pendingGameInvite = typeof window !== 'undefined' ? localStorage.getItem('pendingGameInvite') : null;

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (pendingGameInvite) {
        // Clear the pending invite from storage
        localStorage.removeItem('pendingGameInvite');
        // Redirect to the invite page
        router.push(`/invite/${pendingGameInvite}`);
      } else {
        // Otherwise redirect to returnUrl or home
        router.push(returnUrl || '/');
      }
    }
  }, [status, session, returnUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {pendingGameInvite ? 'Sign In to Join Game' : 'Sign In to Continue'}
        </h1>
        {pendingGameInvite && (
          <p className="text-white/70 text-center mb-6">
            You need to sign in to join the game session
          </p>
        )}
        {/* Add your auth UI components here */}
      </div>
    </div>
  );
}
