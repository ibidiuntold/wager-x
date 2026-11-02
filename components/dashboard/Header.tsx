'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, LogOut, Bell, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAuthActions } from '@/hooks/useAuthActions';
import NotificationBell from '@/components/notification/NotificationBell';

const Header: React.FC = () => {
  const { data: session } = useSession();
  const { signOut } = useAuthActions();
  const user = session?.user;

  return (
    <header className="flex items-center h-16 px-3 sm:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Search — hidden on very small screens, shown from sm: up */}
      <div className="relative flex-grow max-w-md hidden sm:block">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 placeholder-gray-400 dark:placeholder-gray-400"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      <div className="flex items-center ml-auto space-x-2 sm:space-x-4 shrink-0">
        <Link
          href="/"
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <Globe size={20} />
        </Link>

        <NotificationBell />

        <Link
          href="/profile"
          className="flex items-center gap-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full py-1 pl-1 pr-4"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.firstName?.[0]?.toUpperCase() ?? <User size={16} />}
            </div>
          )}
          <div className="hidden md:flex md:flex-col md:items-start">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {user?.nickname ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ?? 'Admin'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role ?? 'admin'}</span>
          </div>
        </Link>

        <button
          onClick={signOut}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
