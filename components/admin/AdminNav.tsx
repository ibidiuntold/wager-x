'use client';

import { useState, useEffect, memo } from 'react';
import { cn } from "@/lib/utils";
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useWithdrawalCount } from "@/hooks/useWithdrawal";
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminNavProps {
  children: React.ReactNode;
}

// Memoize the AdminSidebar to prevent unnecessary rerenders
const MemoizedAdminSidebar = memo(AdminSidebar);
const MemoizedAdminHeader = memo(AdminHeader);

export function AdminNav({ children }: AdminNavProps) {
  // Use media query for responsive behavior
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Sidebar collapsed state
  const [collapsed, setCollapsed] = useState(false);
  
  // Use withdrawal count for notification badge
  // const { pendingCount } = useWithdrawalCount();
  const pendingCount = 0;
  
  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Toggle sidebar function
  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <div className="flex h-screen">
      {/* Sidebar Component */}
      <MemoizedAdminSidebar 
        pendingCount={pendingCount}
        isMobile={isMobile}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header Component */}
        <MemoizedAdminHeader 
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
        />

        {/* Page content with overscroll behavior to help with momentum scrolling */}
        <main className="flex-1 overflow-y-auto bg-muted/5 dark:bg-slate-900/40 overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}

// Export a memoized version for better performance
export default memo(AdminNav);