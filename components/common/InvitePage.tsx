'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReferral } from '@/hooks/useReferral';
import { useAuthActions } from '@/hooks/useAuthActions';
import useAuth from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast'; 

interface InvitePageProps {
  code: string;
}

export default function InvitePage({ code }: InvitePageProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthActions();
  const { user } = useAuth();
  const { toast } = useToast();
  const { completeReferral, referralStats } = useReferral();

  useEffect(() => {
    const handleReferral = async () => {
      try {
        if (typeof window !== 'undefined') {
          // Store referral code in localStorage for later use during signup
          localStorage.setItem('referralCode', code);
        }

        if (isAuthenticated && user?.uid) {
          // Check if user hasn't been referred before using referralStats
          if (referralStats.totalReferrals === 0) {
            // Complete referral if user is logged in and hasn't been referred
            await completeReferral(code, user.uid);
            toast({
              title: 'Welcome!',
              description: 'Referral bonus has been added to your account'
            });
          }
          router.replace('/');
        } else {
          // Redirect to auth page with referral parameter
          router.replace(`/auth?referral=true&code=${code}`);
        }
      } catch (error) {
        console.error('Error handling referral:', error);
        toast({
          title: 'Error',
          description: 'Unable to process referral. Please try again.',
          variant: 'destructive'
        });
        router.replace('/');
      }
    };

    handleReferral();
  }, [code, isAuthenticated, user, router, completeReferral, referralStats, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to WagerX!</h1>
        <p>Redirecting you to the right place...</p>
        <p className="text-sm text-gray-500 mt-2">Processing invite code: {code}</p>
      </div>
    </div>
  );
}
