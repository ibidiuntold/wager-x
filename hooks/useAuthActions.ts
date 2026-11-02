'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface AuthActions {
  signOut: () => Promise<void>;
  user: any | null; // Loosened type to match session user
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuthActions = (): AuthActions => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const signOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      toast({
        title: "Signed out successfully",
        description: "You have been logged out"
      });
      router.replace('/');
    } catch (error) {
      const errorMessage = (error as Error).message || 'An error occurred';
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return {
    signOut,
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
};
