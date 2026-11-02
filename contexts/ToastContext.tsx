'use client';

import React, { createContext, useContext } from 'react';
import type { ToastState } from "@/components/ui/toast.d"

type ToastItem = ToastState['toasts'][number]
type ToastProps = Omit<ToastItem, 'id' | 'open'>

export interface ToastContextValue {
  toasts: ToastState['toasts'];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const toastTimeoutsRef = React.useRef(new Map<string, NodeJS.Timeout>());

  const addToRemoveQueue = React.useCallback((toastId: string) => {
    if (toastTimeoutsRef.current.has(toastId)) return;

    const timeout = setTimeout(() => {
      toastTimeoutsRef.current.delete(toastId);
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 1000);

    toastTimeoutsRef.current.set(toastId, timeout);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, open: false } : t
    ));
    addToRemoveQueue(id);
  }, [addToRemoveQueue]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = crypto.randomUUID();
    setToasts(prev => [
      {
        id,
        title: props.title,
        description: props.description,
        variant: props.variant || "default",
        open: true
      },
      ...prev,
    ]);
  }, []);

  React.useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      toastTimeoutsRef.current.clear();
    };
  }, []);

  const value = React.useMemo(() => ({
    toasts,
    toast,
    dismiss,
  }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Standalone toast function for convenience
export const toast = (props: ToastProps) => {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn('Toast was called outside ToastProvider. This will be a no-op.');
    return;
  }
  context.toast(props);
};
