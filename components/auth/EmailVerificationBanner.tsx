'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import VerificationModal from './VerificationModal';

const EmailVerificationBanner = () => {
    const { data: session, status } = useSession();
  const { sendVerificationEmail } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
  // Check if the user is authenticated and the session data is loaded
  if (status === 'authenticated') {
    const user = session?.user;
    // setShowBanner(user !== null && !user?.emailVerified); // Original logic
    setShowBanner(!!user && !user?.emailVerified); // More concise and safe null check
  } else if (status === 'unauthenticated' || status === 'loading') {
    // Optionally hide the banner if the user is not authenticated or still loading
    setShowBanner(false);
  }
}, [status, session]);

  const handleResend = () => {
    if (session?.user?.email) {
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleVerificationComplete = () => {
    setShowModal(false);
    setShowBanner(false);
  };

  if (!showBanner || status === 'loading') return null;

  return (
    <>
      <div className="bg-green-100/80 dark:bg-green-900/30 border-b border-green-200 dark:border-green-900 z-50 sticky">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2">
                <svg className="h-5 w-5 text-gray-800 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <p className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                Please verify your email address to unlock all features
              </p>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-3">
              <Button
                onClick={handleResend}
                disabled={isLoading}
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
              >
                Resend Verification
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showModal && session?.user?.email && (
        <VerificationModal
          email={session.user.email}
          onClose={handleModalClose}
          onComplete={handleVerificationComplete}
        />
      )}
    </>
  );
};

export default EmailVerificationBanner;