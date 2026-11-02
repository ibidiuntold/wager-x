'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/contexts/NotificationContext';
import { Bell, X } from 'lucide-react';

export function PushNotificationPrompt() {
  const { isPushEnabled, requestPushPermission } = useNotification();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if we should show the push notification prompt
  useEffect(() => {
    // Only show the prompt if push is not enabled and browser supports notifications
    // and the user hasn't dismissed it yet
    const shouldPrompt = 
      !isPushEnabled && 
      !dismissed &&
      'Notification' in window && 
      Notification.permission === 'default';
    
    if (shouldPrompt) {
      const timer = setTimeout(() => {
        // Check if there's a record in localStorage
        const hasPrompted = localStorage.getItem('pushPromptDismissed');
        if (!hasPrompted) {
          setShowPrompt(true);
        }
      }, 15000); // Show after 15 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isPushEnabled, dismissed]);
  
  // Handle push notification permission request
  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    setShowPrompt(false);
    
    // If user denies, record this to not show again
    if (!granted) {
      localStorage.setItem('pushPromptDismissed', 'true');
    }
  };
  
  // Handle dismissing the push prompt
  const dismissPrompt = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pushPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 max-w-sm"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <div className="flex-shrink-0 p-1">
              <Bell className="h-6 w-6 text-purple-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Enable Notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get notifications about bonuses and wins even when the site is closed.
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleEnablePush}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Enable
                </button>
                <button
                  onClick={dismissPrompt}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Not Now
                </button>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="flex-shrink-0 ml-1 h-5 w-5 text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}