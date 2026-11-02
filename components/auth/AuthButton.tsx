'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUIContext } from '@/contexts/UIContext';

interface AuthButtonProps {
  type: 'login' | 'signup';
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'lg';
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  type,
  variant = 'primary',
  size = 'sm',
  className = ''
}) => {
  const { openAuthModal } = useUIContext();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => openAuthModal()}
      className={className}
    >
      {type === 'login' ? 'Login' : 'Sign Up'}
    </Button>
  );
};

export default AuthButton;
