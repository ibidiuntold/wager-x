'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface UseSessionTimeoutOptions {
  timeout?: number; // Timeout in milliseconds
  adminOnly?: boolean; // Only apply timeout for admin users
  warningTime?: number; // Time in ms before timeout to show warning
  activityEvents?: string[]; // DOM events to listen for activity
}

export function useSessionTimeout({
  timeout = 20 * 60 * 1000, // Default 20 minutes
  adminOnly = false,
  warningTime = 60 * 1000, // Default 1 minute warning
  activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
}: UseSessionTimeoutOptions = {}) {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset timers when activity is detected
  const resetTimer = () => {
    if (!user) return;
    
    // Skip for non-admin users if adminOnly is true
    if (adminOnly && userRole !== 'admin' && userRole !== 'manager') return;
    
    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    localStorage.setItem('last_active', lastActivityRef.current.toString());
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);
    
    // Set new timeouts
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        const remaining = timeout - (Date.now() - lastActivityRef.current);
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      }, 1000);
      
      // Clean up countdown on activity
      return () => clearInterval(countdownInterval);
    }, timeout - warningTime);
    
    timeoutRef.current = setTimeout(async () => {
      // Double-check if we should really log out
      const lastActive = localStorage.getItem('last_active');
      if (lastActive) {
        const inactiveTime = Date.now() - parseInt(lastActive);
        if (inactiveTime >= timeout) {
          try {
            await logout();
            router.push('/admin/login');
          } catch (error) {
            console.error('Error logging out:', error);
          }
        }
      }
    }, timeout);
  };

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;
    
    // Skip for non-admin users if adminOnly is true
    if (adminOnly && userRole !== 'admin' && userRole !== 'manager') return;
    
    // Check if we have a stored timestamp
    const lastActive = localStorage.getItem('last_active');
    if (lastActive) {
      const inactiveTime = Date.now() - parseInt(lastActive);
      if (inactiveTime >= timeout) {
        // Already timed out, log out immediately
        logout();
        router.push('/admin/login');
        return;
      }
    }
    
    // Set initial timestamp
    lastActivityRef.current = Date.now();
    localStorage.setItem('last_active', lastActivityRef.current.toString());
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    // Initial timer
    resetTimer();
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, userRole, adminOnly]);

  // Window focus/blur handling
  useEffect(() => {
    if (!user) return;
    
    // Skip for non-admin users if adminOnly is true
    if (adminOnly && userRole !== 'admin' && userRole !== 'manager') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if session has timed out while away
        const lastActive = localStorage.getItem('last_active');
        if (lastActive) {
          const inactiveTime = Date.now() - parseInt(lastActive);
          if (inactiveTime >= timeout) {
            logout();
            router.push('/admin/login');
          } else {
            // Reset timer if we're still active
            resetTimer();
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, userRole, adminOnly, timeout]);

  return {
    showWarning,
    timeRemaining,
    resetTimer
  };
}

export default useSessionTimeout;