"use client"
import React, { useEffect, useRef } from 'react';

export const RenderTracker = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const renders = useRef(0);
  
  useEffect(() => {
    renders.current++;
    console.log(`[RenderTracker] ${id} rendered ${renders.current} times`);
  });

  return <>{children}</>;
};