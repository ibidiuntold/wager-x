'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import SpinningBackground from '@/components/ui/spinner';
import WalletModal from '@/components/common/WalletModal';
import Sidebar from '@/components/Sidebar';
import Preloader from '../common/Preloader';
import { useSession } from 'next-auth/react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalInitialTab, setWalletModalInitialTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const openWalletModal = (tab: 'deposit' | 'withdraw' | 'history') => {
    setWalletModalInitialTab(tab);
    setIsWalletModalOpen(true);
    setIsSidebarOpen(false);
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Adjust timing as needed
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Preloader isLoading={isLoading} layoutType="main" />
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative">
        <SpinningBackground />
        <Navbar openWalletModal={openWalletModal} toggleSidebar={toggleSidebar} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          openWalletModal={openWalletModal} />
        <main className="flex-grow mx-auto relative z-10">
          {children}
          {/* <div className='h-[85px]'></div>F */}
        <Footer />
        </main>
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          initialTab={walletModalInitialTab}
          userId={userId}
        />
      </div>
    </>
  );
};

export default MainLayout;