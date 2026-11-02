'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LayoutSelector from '@/components/common/LayoutSelector';
import HeroSlider from '@/components/main/Hero';
import Games from '@/components/main/NewWagers';
import HowItWorks from '@/components/main/HowItWorks';
import CtaSection from '@/components/main/CtaSection';
import Newsletter from '@/components/main/Newsletter';
import WinningCarousel from '@/components/winners/winners';
import TopGames from '@/components/main/TopGames';
import AuthModal from '@/components/auth/AuthModal';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Dashboard from '@/components/main/Dashboard';
import CustomWagersPromo from '@/components/main/CustomWagersPromo';
import BetOnEverything from '@/components/main/BetOnEverything';
import LeaderboardWidget from '@/components/leaderboard/LeaderboardWidget';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run after component is mounted
    if (!mounted) return;

    // If there's a referral code and user is not signed in, show signup modal
    const refCode = searchParams.get('ref');
    if (refCode && status === 'unauthenticated') {
      setInitialAuthMode('register');
      setShowAuthModal(true);
    }
  }, [searchParams, status, mounted]);

  const handleRequireAuth = () => {
    setShowAuthModal(true);
  };

  // Show loading during hydration or session loading
  if (!mounted || status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <LayoutSelector layoutType="main">
      <ErrorBoundary>
        <HeroSlider />
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Dashboard onRequireAuth={handleRequireAuth} />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary>
        <LeaderboardWidget />
      </ErrorBoundary>

      <ErrorBoundary>
        <BetOnEverything />
      </ErrorBoundary>

      <ErrorBoundary>
        <HowItWorks />
      </ErrorBoundary>

      {/* <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <CustomWagersPromo />
        </Suspense>
      </ErrorBoundary> */}

      {/* <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <WinningCarousel />
        </Suspense>
      </ErrorBoundary> */}

      {/* <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <TopGames />
        </Suspense>
      </ErrorBoundary> */}

      <ErrorBoundary>
        <CtaSection />
      </ErrorBoundary>
      {/* 
      <ErrorBoundary>
        <Newsletter />
      </ErrorBoundary> */}

      <AuthModal
        isOpen={showAuthModal}
        initialMode={initialAuthMode}
        onClose={() => setShowAuthModal(false)}
      />
    </LayoutSelector>
  );
}