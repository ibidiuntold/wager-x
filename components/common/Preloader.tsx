'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type PreloaderType = 'dashboard' | 'game' | 'default';

interface PreloaderProps {
  isLoading: boolean;
  layoutType?: PreloaderType;
  message?: string;
  disableTransition?: boolean;
}

export default function Preloader({ 
  isLoading,
  layoutType = 'default',
  message = 'Loading...',
  disableTransition = false
}: PreloaderProps) {
  const [show, setShow] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Handle initial rendering
  useEffect(() => {
    if (!isLoading) {
      // Only start fade-out animation if we're allowed to transition
      if (!disableTransition) {
        // We need a small delay before starting fade-out to ensure CSS transitions are applied
        setTimeout(() => setShow(false), 150);
        
        // Keep component in DOM until transition completes
        const timer = setTimeout(() => {
          setAnimationComplete(true);
        }, 600); // Match this with CSS transition duration
        
        return () => clearTimeout(timer);
      } else {
        // If transitions are disabled, immediately hide and remove
        setShow(false);
        setAnimationComplete(true);
      }
    } else {
      // Reset states when isLoading becomes true again
      setShow(true);
      setAnimationComplete(false);
      setProgress(0);
    }
  }, [isLoading, disableTransition]);
  
  // Simulate loading progress
  useEffect(() => {
    if (isLoading && progress < 90) {
      const timer = setTimeout(() => {
        setProgress(prev => {
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 90);
        });
      }, 200);
      
      return () => clearTimeout(timer);
    }
    
    if (!isLoading && progress < 100) {
      setProgress(100);
    }
  }, [isLoading, progress]);
  
  // Early return if we're done animating and not loading
  if (!isLoading && animationComplete) {
    return null;
  }
  
  // Render layout based on type
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background",
        "transition-opacity duration-500 ease-in-out",
        show ? "opacity-100" : "opacity-0",
        layoutType === 'dashboard' && "bg-muted/5 dark:bg-slate-900/40",
        layoutType === 'game' && "bg-black/90"
      )}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative h-16 w-40 mb-8">
          <Image
            src="/images/logo/Logo-blank.svg"
            alt="WagerX"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 640px"
            className={cn(
              "object-contain transition-transform duration-1000",
              "dark:invert", // Invert in dark mode
              "dark:brightness-100 brightness-50 hue-rotate-[250deg]", // Purple tint in light mode
              show ? "scale-100" : "scale-110"
            )}
          />
        </div>
        
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-purple-700 dark:from-white dark:to-slate-100 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className={cn(
          "text-sm font-medium text-muted-foreground",
          layoutType === 'game' && "text-white/80"
        )}>
          {message}
        </p>
      </div>
    </div>
  );
}