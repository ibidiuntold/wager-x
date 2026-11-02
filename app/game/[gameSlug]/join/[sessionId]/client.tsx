'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useInviteActions } from '@/hooks/useInviteActions';
import AuthModal from '@/components/auth/AuthModal';
import { useToast } from '@/components/ui/use-toast';

export default function JoinGameClient() {
  const router = useRouter();
  const params = useParams();
  const gameSlug = params.gameSlug as string;
  const sessionId = params.sessionId as string;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { status } = useSession();
  const { acceptInvite } = useInviteActions();
  const { toast } = useToast();

  useEffect(() => {
    const handleInvite = async () => {
      if (status === 'unauthenticated') {
        setShowAuthModal(true);
        return;
      }

      try {
        await acceptInvite(sessionId);
        // Don't redirect - let the match modal handle the flow
      } catch (error) {
        console.error('Error joining game:', error);
        toast({
          title: "Error",
          description: "Failed to join game. Please try again.",
          variant: "destructive"
        });
        router.push(`/game/${gameSlug}`);
      }
    };

    if (status !== 'loading') {
      handleInvite();
    }
  }, [status, sessionId, gameSlug, router, acceptInvite, toast]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white text-lg">Joining game...</p>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            router.push(`/game/${gameSlug}`);
          }}
          initialMode="register"
        />
      )}
    </>
  );
}
