'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LayoutSelector from '@/components/common/LayoutSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { ChevronLeft } from 'lucide-react';
import { CreateWagerForm } from '@/components/wagers/CreateWagerForm';
import AuthModal from '@/components/auth/AuthModal';
import { useWalletData } from '@/hooks/useWalletData';

export default function CreateWagerPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const searchParams = useSearchParams();
  const [categoryData, setCategoryData] = useState<string | null>(null);

  // Safe destructuring with error handling
  const walletData = useWalletData();
  console.log('Wallet data received:', walletData); // Debug log

  const currentUserData = walletData?.currentUserData || null;
  const isWalletLoading = walletData?.isLoading || false;

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user) {
        setIsAuthorized(true);
      } else {
        setShowAuthModal(true);
      }
    }
  }, [status, session]);

  useEffect(() => {
    const categoryString = searchParams.get('category');
    if (categoryString) {
      setCategoryData(categoryString);
    }
  }, [searchParams]);

  const handleAuthSuccess = () => {
    setIsAuthorized(true);
    setShowAuthModal(false);
  };

  // Check if user has sufficient balance to create a wager
  const creationFee = process.env.NEXT_PUBLIC_WAGER_CREATION_FEE ?
    Number(process.env.NEXT_PUBLIC_WAGER_CREATION_FEE) : 0;

  const hasInsufficientBalance = !isWalletLoading &&
    currentUserData &&
    creationFee > 0 &&
    (currentUserData.walletBalance || 0) < creationFee;

  if (!isAuthorized && status === 'unauthenticated') {
    return (
      <LayoutSelector layoutType="main">
        <div className="container mx-auto py-8 px-4 my-16">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              className="mr-2"
              onClick={() => router.push('/wagers')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>Custom Wager</CardTitle>
              <CardDescription>You need to sign in to create a wager</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-12">
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>

          <AuthModal
            isOpen={showAuthModal}
            initialMode="login"
            onClose={() => router.push('/wagers')}
            onSuccess={handleAuthSuccess}
          />
        </div>
      </LayoutSelector>
    );
  }

  if (status === 'loading' || !isAuthorized) {
    return (
      <LayoutSelector layoutType="main">
        <div className="container mx-auto py-8 px-4">
          <Card className="w-full max-w-4xl mx-auto shadow-lg animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutSelector>
    );
  }

  if (hasInsufficientBalance) {
    return (
      <LayoutSelector layoutType="main">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              className="mr-2"
              onClick={() => router.push('/wagers')}
            >
              <ChevronLeft className="h-6 w-6 mr-1" />
              Back
            </Button>
          </div>

          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>Insufficient Balance</CardTitle>
              <CardDescription>
                You need ₦{creationFee.toLocaleString()} in your wallet to create a wager.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Your current balance: ₦{(currentUserData?.walletBalance || 0).toLocaleString()}
              </p>
              <Button
                onClick={() => router.push('/wallet')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </div>
      </LayoutSelector>
    );
  }

  return (
    <LayoutSelector layoutType="main">
      <div className="container mx-auto max-w-7xl py-4 px-4 my-16">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => router.push('/wagers')}
          >
            <ChevronLeft className="h-6 w-6 mr-1" />
            Back
          </Button>
        </div>

        <Card className="w-full max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Create Your Wager</CardTitle>
            <CardDescription>
              Set up a custom wager and invite friends to participate
              {creationFee > 0 && (
                <span className="block mt-1 text-xs text-gray-500">
                  Creation fee: ₦{creationFee.toLocaleString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWagerForm categoryData={categoryData} />
          </CardContent>
        </Card>
      </div>
    </LayoutSelector>
  );
}