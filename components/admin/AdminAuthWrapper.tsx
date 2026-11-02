'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import SessionTimeoutWarning from './SessionTimeoutWarning';
import { cacheService } from '@/services/cacheService';

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const isLoginPage = pathname === '/admin/login';
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  
  // Use session timeout hook for admins only - 6 hours with 5 min warning
  const { showWarning, timeRemaining, resetTimer } = useSessionTimeout({
    adminOnly: true,
    timeout: 6 * 60 * 60 * 1000, // 6 hours
    warningTime: 5 * 60 * 1000 // 5 minute warning
  });

  // Efficiently check for access without multiple redirects
  useEffect(() => {
    if (!isLoading) {
      // Scenario 1: User is on login page but already authenticated with admin rights
      if (isLoginPage && user && (userRole === 'admin')) {
        router.push('/admin/dashboard');
        return;
      }

      // Scenario 2: User is trying to access admin pages without auth or proper role
      if (!isLoginPage && (!user || (userRole !== 'admin'))) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this area",
          variant: "destructive"
        });
        
        // Clear admin-related caches before redirecting
        const adminCacheKeys = cacheService.getKeys(/^admin_|^withdrawal_count/);
        adminCacheKeys.forEach(key => cacheService.remove(key));
        
        router.push('/admin/login');
        return;
      }
      
      // Authentication check is complete
      setInitialAuthCheckComplete(true);
    }
  }, [user, userRole, isLoading, isLoginPage, router, toast]);

  // Handle session reset on user activity
  const handleSessionContinue = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Show a skeleton loader during authentication verification
  if (isLoading || !initialAuthCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showWarning && (
        <SessionTimeoutWarning
          timeRemaining={timeRemaining}
          onContinue={handleSessionContinue}
        />
      )}
    </>
  );
}

export default AdminAuthWrapper;