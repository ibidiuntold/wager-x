'use client';

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useReferral } from '@/hooks/useReferral';
import { useAuthActions } from '@/hooks/useAuthActions';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'sidebar' | 'default';
  className?: string;
}

const defaultMetadata = {
  title: 'Join WagerX',
  description: 'Play games, compete, and win on WagerX - The ultimate gaming platform!',
  image: 'https://wagerx.ng/wager-invite.jpg'
};

export const ShareButton: React.FC<ShareButtonProps> = ({ 
  size = 'md', 
  variant = 'default',
  className 
}) => {
  const { createReferral, getUserReferralCode } = useReferral();
  const { isAuthenticated } = useAuthActions();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchReferralCode = async () => {
        const code = await getUserReferralCode();
        setReferralCode(code);
      };
      fetchReferralCode();
    }
  }, [isAuthenticated, getUserReferralCode]);

  const getShareContent = async () => {
    const baseUrl = 'https://wagerx.ng';
    
    if (isAuthenticated && referralCode) {
      await createReferral(referralCode);
      const shareUrl = `${baseUrl}/ref/${referralCode}`;
      return {
        title: '🤑 Join me on WagerX!',
        text: `Use my invite link: ${shareUrl}`,
        url: shareUrl
      };
    }
  
    return {
      title: defaultMetadata.title,
      text: `${defaultMetadata.description} Join now at ${baseUrl}`,
      url: baseUrl
    };
  };
  
  const handleShare = async () => {
    try {
      setIsLoading(true);
      const shareContent = await getShareContent();
  
      if (navigator.share) {
        await navigator.share({
          url: shareContent.url, // Prioritize URL
          // Optionally include text or title if needed
          title: shareContent.title
        });
        toast({
          title: 'Link Shared!',
          description: 'Invite link shared successfully'
        });
      } else {
        await navigator.clipboard.writeText(shareContent.url);
        toast({
          title: 'Link Copied!',
          description: 'Invite link copied to clipboard'
        });
      }
    } catch (error) {
      // Silently ignore share cancellation
      // All other errors are also ignored to keep the UX clean
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4',
    lg: 'py-4 px-5 text-lg'
  };

  const variantClasses = {
    sidebar: 'w-full text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700',
    default: 'bg-primary text-white hover:bg-primary/90'
  };

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className={cn(
        'flex items-center rounded-lg transition-colors duration-200',
        sizeClasses[size],
        variantClasses[variant],
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Send className={cn('mr-3', {
        'h-4 w-4': size === 'sm',
        'h-5 w-5': size === 'md',
        'h-6 w-6': size === 'lg'
      })} />
      {isAuthenticated ? 'Share & Earn' : 'Share'}
    </button>
  );
};

export default ShareButton;