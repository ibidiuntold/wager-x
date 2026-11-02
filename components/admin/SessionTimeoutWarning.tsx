'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';

interface SessionTimeoutWarningProps {
  timeRemaining: number | null;
  onContinue: () => void;
}

export default function SessionTimeoutWarning({ 
  timeRemaining, 
  onContinue 
}: SessionTimeoutWarningProps) {
  const [open, setOpen] = useState(true);
  const [displayTime, setDisplayTime] = useState<string>('00:00');
  const { logout } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format remaining time as mm:ss
  const formatTime = useCallback((seconds: number | null): string => {
    if (seconds === null) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Update timer display
  useEffect(() => {
    if (timeRemaining === null) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Initial update
    setDisplayTime(formatTime(timeRemaining));
    
    // Set interval for countdown
    let remainingSeconds = timeRemaining;
    timerRef.current = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleLogout();
      } else {
        setDisplayTime(formatTime(remainingSeconds));
      }
    }, 1000);
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, formatTime]);
  
  const handleContinue = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onContinue();
    setOpen(false);
  }, [onContinue]);
  
  const handleLogout = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [logout]);
  
  // Auto-continue session if user interacts elsewhere
  // but only if there's plenty of time left (> 30s)
  useEffect(() => {
    const userActivityEvents = ['click', 'keydown', 'mousemove', 'touchstart'];
    
    const handleUserInteraction = () => {
      if (timeRemaining && timeRemaining > 30) {
        handleContinue();
      }
    };
    
    userActivityEvents.forEach(event => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });
    
    return () => {
      userActivityEvents.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [timeRemaining, handleContinue]);
  
  // Dialog closing handler
  const handleDialogChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      // If dialog is closing, assume user wants to continue
      handleContinue();
    }
    setOpen(isOpen);
  }, [handleContinue]);

  return (
    <AlertDialog open={open} onOpenChange={handleDialogChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session is about to expire due to inactivity.
            <div className="mt-2">
              <span className="text-sm font-medium">Time remaining: </span>
              <span className="text-yellow-600 dark:text-yellow-400 font-mono font-bold">{displayTime}</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-2">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          <AlertDialogAction asChild>
            <Button onClick={handleContinue}>Continue Session</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}