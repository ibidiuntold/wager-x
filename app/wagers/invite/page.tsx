'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LayoutSelector from '@/components/common/LayoutSelector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import AuthModal from '@/components/auth/AuthModal';
import { useWalletData } from '@/hooks/useWalletData';
import { useToast } from '@/components/ui/use-toast';

export default function WagerInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const { currentUserData } = useWalletData();

  const [wager, setWager] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const inviteCode = params.inviteCode as string;

  // fetch wager by invite code from backend API
  useEffect(() => {
    const fetchWagerByInviteCode = async () => {
      if (!inviteCode) return;

      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/wagers/invite/${inviteCode}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch wager');
        }

        setWager(data.wager);
      } catch (err: any) {
        console.error('Error fetching wager:', err);
        setError(err.message || 'Failed to load invitation. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWagerByInviteCode();
  }, [inviteCode]);

  const handleJoinWager = async () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    if (wager?.isExpired) {
      toast({
        title: "Wager Expired",
        description: "This wager is no longer accepting new participants",
        variant: "destructive",
      });
      return;
    }

    if (wager?.isPrivate && !wager?.invitedFriends?.includes(session.user.id)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to join this private wager",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsJoining(true);
      const res = await fetch(`/api/wagers/${wager.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join wager');
      }

      toast({ title: 'Joined Wager', description: 'You have successfully joined this wager!' });
      router.push(`/wagers/${wager.slug}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (wager) {
      router.push(`/wagers/${wager.slug}`);
    }
  };

  if (isLoading) {
    return (
      <LayoutSelector layoutType="main">
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </LayoutSelector>
    );
  }

  if (error || !wager) {
    return (
      <LayoutSelector layoutType="main">
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                Invitation Error
              </CardTitle>
              <CardDescription>There was a problem with this invitation</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error || 'Invalid invitation link'}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => router.push('/wagers')}
                className="w-full"
              >
                Browse Available Wagers
              </Button>
            </CardFooter>
          </Card>
        </div>
      </LayoutSelector>
    );
  }

  const isWagerExpired = wager.isExpired;
  const hasInsufficientBalance =
    currentUserData &&
    wager.minimumEntry &&
    (currentUserData.walletBalance || 0) < wager.minimumEntry;

  return (
    <LayoutSelector layoutType="main">
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 text-purple-500 mr-2" />
              Wager Invitation
            </CardTitle>
            <CardDescription>You've been invited to join a wager</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-xl font-bold mb-2">{wager.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{wager.description}</p>
              {wager.minimumEntry > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500">Minimum Entry: </span>
                  <span className="font-medium text-purple-600">
                    ₦{wager.minimumEntry.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {isWagerExpired && (
              <Alert variant="destructive">
                <AlertDescription>
                  This wager has expired or is no longer accepting new participants.
                </AlertDescription>
              </Alert>
            )}

            {hasInsufficientBalance && !isWagerExpired && (
              <Alert variant="destructive">
                <AlertDescription>
                  You need at least ₦{wager.minimumEntry.toLocaleString()} in your wallet to join this wager.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => router.push('/wagers')}
              className="w-full sm:w-auto"
            >
              Browse Other Wagers
            </Button>
            <Button
              onClick={handleJoinWager}
              disabled={isJoining || isWagerExpired || hasInsufficientBalance}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Wager
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        initialMode="login"
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </LayoutSelector>
  );
}
