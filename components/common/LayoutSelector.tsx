'use client';

import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import GameLayout from '@/components/layouts/GameLayout';
import { useSession } from 'next-auth/react';

type LayoutType = 'main' | 'dashboard' | 'game' | 'auth';

interface LayoutSelectorProps {
  layoutType: LayoutType;
  children: React.ReactNode;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ layoutType, children }) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  switch (layoutType) {
    case 'dashboard':
      if (!user || (user?.role !== 'admin' && user?.role !== 'manager')) {
        return <MainLayout>{children}</MainLayout>;
      }
      return <DashboardLayout>{children}</DashboardLayout>;
    // case 'game':
    //   return <GameLayout>{children}</GameLayout>;
    case 'main':
      <MainLayout>{children}</MainLayout>
    default:
      return <MainLayout>{children}</MainLayout>;
  }
};

export default LayoutSelector;