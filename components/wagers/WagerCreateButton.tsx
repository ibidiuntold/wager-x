'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthModal from '@/components/auth/AuthModal';

interface WagerCreateButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export const WagerCreateButton: React.FC<WagerCreateButtonProps> = ({
  className = '',
  variant = 'default',
  size = 'default',
  showText = true
}) => {
  const router = useRouter();
  const { data: session } = useSession(); // Removed status as it's not directly used for isSignedIn check
  const isSignedIn = !!session?.user; // Ensure `isSignedIn` is a boolean
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleClick = () => {
    if (isSignedIn) {
      router.push('/wagers/create');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    router.push('/wagers/create');
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 ${className}`}
      >
        <Plus className={`h-4 w-4 ${showText ? 'mr-2' : ''}`} />
        {showText && 'Create Wager'}
      </Button>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode="login"
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default WagerCreateButton;