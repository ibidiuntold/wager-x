'use client';

import React, { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import { X, User, LogOut, LogIn, Bell, Settings, HandCoins, Home, ShieldCheck } from 'lucide-react';
import WalletBalance from './ui/balance';
import UserLevel from './common/Level';
import SideProfile from './common/SideProfile';
import SocialLinks from './common/SocialLinks';
import SideTask from './common/SideTask';
import SideWagers from './common/SideWagers';
import { useToast } from '@/components/ui/use-toast';
import AuthModal from './auth/AuthModal';
import { useAuthActions } from '@/hooks/useAuthActions';
import ShareButton from './common/ShareButton';
import { useSession } from 'next-auth/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  openWalletModal: (tab: 'deposit' | 'withdraw' | 'history') => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, onClose, openWalletModal }) => {
  const { signOut, isAuthenticated } = useAuthActions();
  const { toast } = useToast();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const { data: session, status } = useSession();
  const userData = session?.user;
  const isLoading = status === 'loading';

  const [walletData, setWalletData] = useState<any | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const handleAuthModalClose = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Sidebar Content */}
      <div className="relative w-[90vw] bg-[#0f1420] flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4">
          <Link href="/" onClick={onClose}>
            <img
              src="/images/logo/Logo.svg"
              alt="Logo"
              className="h-9 w-auto"
            />
          </Link>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* User Info (Authenticated) */}
        {isAuthenticated && (
          <div className="px-6 pt-4">
            <SideProfile userData={userData} isLoading={isLoading} />
            <div className="mt-4 space-y-4">
              <WalletBalance
                openWalletModal={openWalletModal}
              />
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-6">
          <ul className="space-y-2">
            <li>
              <Link href="/wagers" className="flex items-center py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4" onClick={onClose}>
                <HandCoins className="mr-3 h-5 w-5" />
                Wagers
              </Link>
            </li>
            <li>
              <Link href="/about" className="flex items-center py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4" onClick={onClose}>
                <Home className="mr-3 h-5 w-5" />
                About
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link href="/profile" className="flex items-center py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4" onClick={onClose}>
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </Link>
              </li>
            )}
            {isAuthenticated && userData?.role === 'admin' && (
              <li>
                <Link href="/admin/dashboard" className="flex items-center py-3 text-purple-400 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4" onClick={onClose}>
                  <ShieldCheck className="mr-3 h-5 w-5" />
                  Admin Panel
                </Link>
              </li>
            )}

            {/* <li>
             <Link href="/settings" className="flex items-center py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4" onClick={onClose}>
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </li> */}
            <li className="mt-4">
              <ShareButton variant="sidebar" />
            </li>
            {isAuthenticated ? (
              <li>
                <button
                  onClick={signOut}
                  className="flex items-center py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
              </li>
            ) : (
              <li>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors duration-200 px-4"
                >
                  <LogIn className="mr-3 h-5 w-5" />
                  Login
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Social Links */}
        <div className="p-6 border-t border-gray-800">
          <SocialLinks />
        </div>
      </div>

      {/* Backdrop */}
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode="login"
          onClose={handleAuthModalClose}
        />
      )}
    </div>
  );
};

const Sidebar = memo(SidebarComponent);
export default Sidebar;