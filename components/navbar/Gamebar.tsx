'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/notification/NotificationBell';

interface GamebarProps {
  openWalletModal: (tab: 'deposit' | 'withdraw' | 'history') => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Gamebar: React.FC<GamebarProps> = ({ openWalletModal, toggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 bg-transparent h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Button variant="ghost" size="sm" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="ml-2">Menu</span>
          </Button>

          <div className="absolute left-1/2 transform -translate-x-1/2 flex justify-center items-center h-full">
            <Link href="/" className="hover:animate-pulse">
              <img
                src="/images/logo/Logo.svg"
                alt="Logo"
                className="h-14 w-auto"
              />
            </Link>
          </div>
          
          {/* Add notification bell for authenticated users */}
          <div className="flex items-center space-x-2">
            {user && <NotificationBell />}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Gamebar;