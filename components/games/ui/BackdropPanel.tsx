'use client';

import React from 'react';
import { cn } from "@/lib/utils";

interface BackdropPanelProps {
  children: React.ReactNode;
  className?: string;
}

const BackdropPanel: React.FC<BackdropPanelProps> = ({ 
  children,
  className
}) => {
  return (
    <div 
      className={cn(
        "bg-slate-200 dark:bg-black/30 backdrop-blur-lg rounded-xl shadow-lg", 
        "border border-white/10",
        className
      )}
    >
      {children}
    </div>
  );
};

export default BackdropPanel;