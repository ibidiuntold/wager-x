'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import BaseModal from './BaseModal';
import  GoogleIcon from '@/components/icons/GoogleIcon';
import { useAuth } from '@/hooks/useAuth';

interface RegisterOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterOAuthModal: React.FC<RegisterOAuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, linkGoogleAccount } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      // Attempt to link Google account or sign in
      await linkGoogleAccount();
      onClose();
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Registration"
      showCloseButton={true}
    >
      <div className="space-y-6 p-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">One Last Step!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Link your account with Google to enable enhanced security features and easier login.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          
          <div className="text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Skip for now
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By linking your account, you'll be able to:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Sign in more securely</li>
            <li>Recover your account easily</li>
            <li>Sync your data across devices</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
};

export default RegisterOAuthModal;