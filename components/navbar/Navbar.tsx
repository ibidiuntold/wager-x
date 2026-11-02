'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // wherever you placed the dropdown file
import Link from 'next/link';
import { Menu, Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import NavBalance from './nav-balance';
import NotificationBell from '@/components/notification/NotificationBell';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthActions } from "@/hooks/useAuthActions";
import WalletModal from '../common/WalletModal';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';
import { useAuthSession } from '@/hooks/useAuthSession';
// import WagerXLogo from './WagerXLogo'; // Assuming you have a component for the logo

interface NavbarProps {
  openWalletModal: (tab: 'deposit' | 'withdraw' | 'history') => void;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ openWalletModal, toggleSidebar }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  const { theme, toggleTheme } = useTheme();
  const { user, loading: isLoading } = useAuthSession();
  const { signOut, user: profile, isLoading: loading } = useAuthActions();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuthModal = (mode: 'login' | 'register') => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };

  if (isLoading) {
    return <div className="h-16" />;
  }

  return (
    <>
      {/* {user && !user?.emailVerified && <EmailVerificationBanner />} */}
      <nav className="fixed top-0 left-0 right-0 z-20 transition-colors duration-300 h-20">
        <div className="max-w-full px-2 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center p-3 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <img
                src="/images/logo/Logo.svg"
                alt="Logo"
                className="h-9 w-auto"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6 md:space-x-5 font-semibold text-gray-600 dark:text-gray-300">
              <Link
                href="/about"
                className="p-3 px-5 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300"
              >
                ABOUT
              </Link>
              <Link
                href="/wagers"
                className="p-3 px-5 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300"
              >
                WAGERS
              </Link>
              <Link
                href="/faq"
                className="p-3 px-5 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300"
              >
                FAQ
              </Link>
            </div>

            {/* Right-side content */}
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex items-center space-x-4">
                {user ? (
                  <>
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300">
                      <NavBalance openWalletModal={openWalletModal} />
                    </div>

                    <div className="p-1 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 hover:bg-gray-100 transition-all duration-300">
                      <NotificationBell />
                    </div>

                    {/* Profile Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-3 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300">
                          <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 bg-white dark:bg-gray-900">
                        {user?.role === 'admin' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/admin/dashboard" className="flex items-center">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Admin Panel</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={signOut}
                          className="text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => openAuthModal('login')}
                      className="p-6 px-7 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300 text-gray-800 dark:text-gray-200 font-semibold text-md"
                    >
                      Sign In
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openAuthModal('register')}
                      className="p-6 px-7 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300 font-semibold text-md"
                    >
                      Join Now
                    </Button>
                  </>
                )}


              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-3 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300 text-gray-600 dark:text-gray-300"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {/* Mobile Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden py-6 px-2 bg-white dark:bg-gray-900 rounded-full shadow shadow-[#573EDA] hover:shadow-md hover:scale-105 transition-all duration-300 text-gray-600 dark:text-gray-300"
                aria-label="Open menu"
              >
                <Menu className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={initialAuthMode}
        onClose={() => setShowAuthModal(false)}
      />
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} userId={user?.id} />

    </>
  );
};

// Simple Logo Component for better reusability
const WagerXLogo: React.FC<{ className: string }> = ({ className }) => {
  return (
    <div className={className}>
      <span className="text-white text-2xl font-bold font-sans">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Wager</span>
        <span className="text-white">X</span>
      </span>
    </div>
  );
};

export default Navbar;