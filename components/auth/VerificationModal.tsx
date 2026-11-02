'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending';

interface VerificationModalProps {
  email: string;
  onClose: () => void;
  onComplete: () => void;
  onCloseAndSwitchToLogin: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  email,
  onClose,
  onComplete,
  onCloseAndSwitchToLogin
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    // your existing resend logic
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 200);
  };

  const handleVerificationComplete = () => {
    setIsOpen(false);
    setTimeout(onComplete, 200);
  };

  const handleVerifyLater = () => {
    setIsOpen(false);
    // setTimeout(onCloseAndSwitchToLogin, 200);
  };

  const handleManualCheck = async () => {
    if (!email) return;
    setChecking(true);

    try {
      const res = await fetch(`/api/users/status?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to check status');
      }

      const status: UserStatus = data.status;
      const isVerified: boolean = data.isVerified;

      if (!isVerified) {
        toast({
          title: 'Email not verified yet',
          description: 'Please check your mail and click the verification link.',
          variant: 'destructive',
        });
      } else if (status === 'active') {
        toast({
          title: 'Account verified!',
          description: 'You can now log in.',
        });
        onCloseAndSwitchToLogin();
      } else {
        toast({
          title: 'Account issue',
          description: `Your account is currently ${status}. Please contact support if this is a mistake.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Unable to check account status. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: isOpen ? 1 : 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {email}
            </span>
          </p>
          <div className="space-y-3">
            <Button
              variant="default"
              className="w-full"
              onClick={handleManualCheck}
              disabled={checking}
            >
              {checking ? 'Checking...' : "I've Verified My Account"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleVerifyLater}
            >
              I'll verify later
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResendEmail}
              disabled={cooldown > 0}
              className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {cooldown > 0
                ? `wait ${cooldown}s to resend`
                : 'resend verification email'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VerificationModal;
