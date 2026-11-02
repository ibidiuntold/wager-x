import React, { createContext, useContext, useState, ReactNode } from 'react';
import AuthModal from '@/components/auth/AuthModal';

interface UIContextProps {
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const UIContext = createContext<UIContextProps>({
  showAuthModal: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const useUIContext = () => useContext(UIContext);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <UIContext.Provider
      value={{
        showAuthModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          initialMode="login"  // or you can make this dynamic if needed
        />
      )}
    </UIContext.Provider>
  );
};