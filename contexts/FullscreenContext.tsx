import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FullscreenContextType {
  isFullScreen: boolean;
  setIsFullScreen: (isFullScreen: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

export const FullscreenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <FullscreenContext.Provider value={{ isFullScreen, setIsFullScreen }}>
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
};