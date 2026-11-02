'use client';

import React, { createContext, useContext, useState } from 'react';

interface WagerContextType {
  wager: number;
  setWager: (amount: number) => void;
}

const WagerContext = createContext<WagerContextType | null>(null);

export function WagerProvider({ children, initialWager }: { children: React.ReactNode; initialWager: number }) {
  const [wager, setWager] = useState(initialWager);

  return (
    <WagerContext.Provider value={{ wager, setWager }}>
      {children}
    </WagerContext.Provider>
  );
}

export const useWager = () => {
  const context = useContext(WagerContext); 
  if (!context) {
    throw new Error('useWager must be used within a WagerProvider');
  }
  return context;
};