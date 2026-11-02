'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BaseModal from './BaseModal';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/lib/form-validators';
import { Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (error: any) {
      let message = 'An error occurred. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account exists with this email address.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <Button
        variant="ghost"
        onClick={handleClose}
        disabled={isLoading}
      >
        {isSuccess ? 'Close' : 'Cancel'}
      </Button>
      {!isSuccess && (
        <Button
          type="submit"
          form="reset-password-form"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </>
          ) : (
            'Recover Password'
          )}
        </Button>
      )}
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      footer={footer}
    >
      {isSuccess ? (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Check your email</h3>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent password reset instructions to{' '}
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {email}
            </span>
          </p>
        </div>
      ) : (
        <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Enter your email address and we'll send you instructions to reset your password.
            </label>
            <input
              id="email"
              type="email"
              placeholder="me@wagerx.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800"
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </form>
      )}
    </BaseModal>
  );
};

export default ForgotPasswordModal;