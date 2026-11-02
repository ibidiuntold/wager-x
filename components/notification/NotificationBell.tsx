'use client';

import Image from 'next/image';
import { useNotification } from '@/contexts/NotificationContext';
import { NotificationErrorBoundary } from './NotificationErrorBoundary';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { unreadCount, toggleDropdown, isDropdownOpen } = useNotification();
  
  return (
    <NotificationErrorBoundary>
      <div className="relative hidden sm:block">
        <button
          onClick={toggleDropdown}
          className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
          aria-label="Notifications"
        >
          <Image 
            src="/images/logo/w-logo.svg" 
            alt="Logo" 
            width={28} 
            height={28} 
            className="h-6 w-6 dark:invert" 
          />
          
          {/* Notification counter */}
          {unreadCount > 0 && (
            <>
              <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
              <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
            </>
          )}
        </button>
        
        {/* Notification Dropdown */}
        <NotificationDropdown isOpen={isDropdownOpen} onClose={toggleDropdown} />
      </div>
    </NotificationErrorBoundary>
  );
}