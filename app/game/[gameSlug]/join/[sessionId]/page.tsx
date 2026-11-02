'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useToast } from '@/components/ui/use-toast';

export default function GameJoinPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthActions();
  const { toast } = useToast();
  const { gameSlug, sessionId } = params;

  useEffect(() => {
    const handleJoin = async () => {
      try {
        if (!isAuthenticated) {
          // Store join info in localStorage for post-login redirect
          localStorage.setItem('pendingGameJoin', JSON.stringify({
            gameSlug,
            sessionId,
            timestamp: Date.now()
          }));
          
          // Redirect to auth page
          router.push(`/auth?redirect=game&gameSlug=${gameSlug}&sessionId=${sessionId}`);
          return;
        }

        // TODO: Validate session and handle game join
        // For now, redirect to game page
        router.push(`/game/${gameSlug}?session=${sessionId}`);
        
      } catch (error) {
        console.error('Error joining game:', error);
        toast({
          title: 'Error',
          description: 'Unable to join game. Please try again.',
          variant: 'destructive'
        });
        router.push(`/game/${gameSlug}?error=join-failed`);
      }
    };

    handleJoin();
  }, [gameSlug, sessionId, isAuthenticated, router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Joining Game...</h1>
        <p>Please wait while we process your request.</p>
      </div>
    </div>
  );
}
