'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Skeleton } from "@/components/ui/skeleton";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/login',
  loadingComponent
}: RoleGuardProps) {
  const { user, userRole, isLoading, hasPermission } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    // Wait until auth is fully loaded
    if (!isLoading) {
      setIsCheckingAuth(false);
      
      // Not authenticated
      if (!user) {
        router.push(redirectTo);
        return;
      }
      
      // Check permission
      const hasAccess = hasPermission(allowedRoles, userRole as UserRole);
      setIsAuthorized(hasAccess);
      
      // Redirect if no permission
      if (!hasAccess && redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [user, userRole, isLoading, allowedRoles, hasPermission, router, redirectTo]);

  if (isLoading || isCheckingAuth) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 max-w-md w-full p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Don't render anything while redirecting
    return null;
  }

  return isAuthorized ? <>{children}</> : (fallback || null);
}