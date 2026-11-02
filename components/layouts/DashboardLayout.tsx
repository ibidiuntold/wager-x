'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import Preloader from '../common/Preloader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentUserData: userProfile } = useUserData();

  useEffect(() => {
    if (!authLoading && (!user || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'manager'))) {
      router.push('/');
    } else if (!authLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    if (!isLoading && (!user || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'manager'))) {
      router.push('/');
    }
  }, [user, userProfile, isLoading, router]);

  if (isLoading || !user || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'manager')) {
    return null;
  }

  return (
    <>
    <Preloader isLoading={isLoading || authLoading} layoutType="dashboard" />
      <div className="flex h-screen bg-gray-100 dark:bg-slate-700">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-slate-700">
            <div className="container mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div> 
    </>
  );
};

export default DashboardLayout;