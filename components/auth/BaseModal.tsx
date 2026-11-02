'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  showCloseButton = true,
  footer,
  className = '',
  children,
  showBackButton = false,
  onBack,
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  const modalVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      y: 50
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const backgroundVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={backgroundVariants}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            key="modal-content"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={modalVariants}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden ${className}`}
          >
            {(title || showCloseButton || showBackButton) && (
              <div className={`flex items-center border-b border-gray-200 dark:border-gray-700 p-4 ${headerClassName}`}>
                {showBackButton && onBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="mr-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                
                {title && (
                  <div className="flex-1 text-center">
                    {typeof title === 'string' ? (
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                    ) : (
                      title
                    )}
                  </div>
                )}

                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="ml-auto"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}

            <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
              <div className="p-6">
                {children}
              </div>
            </div>

            {footer && (
              <div className={`border-t border-gray-200 dark:border-gray-700 p-4 ${footerClassName}`}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BaseModal;