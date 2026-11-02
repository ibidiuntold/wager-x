'use client';

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'dropdown' | 'toast' | 'push';
  scope: 'global' | 'personal';
  read?: boolean;
  createdAt: Date | string | { toDate: () => Date };
  userId?: string;
  createdBy?: string;
  buttons?: Array<{ text: string; link: string }>;
  expiresAt?: Date | string;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<string>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  isPushEnabled: boolean;
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  isLoading: boolean;
  error: Error | null;
  broadcastNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'userId'>) => Promise<string>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Load notifications from REST API
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch notifications');
      setNotifications(result.notifications || []);
      setUnreadCount((result.notifications || []).filter((n: Notification) => !n.read).length);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Check push notification permission on mount
  useEffect(() => {
    const checkPushPermission = async () => {
      if ('Notification' in window) {
        const permission = await Notification.permission;
        setIsPushEnabled(permission === 'granted');
      }
    };
    checkPushPermission();
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support push notifications');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPushEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...notification, userId: notification.scope === 'personal' ? user?.id : undefined }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add notification');
      fetchNotifications();
      if (notification.category === 'toast') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        });
      }
      return result.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }, [user, toast, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [fetchNotifications]);

  const removeNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications();
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }, [fetchNotifications]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const broadcastNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to broadcast notification');
      fetchNotifications();
      return result.id;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        requestPushPermission,
        isPushEnabled,
        isDropdownOpen,
        toggleDropdown,
        closeDropdown,
        isLoading,
        error,
        broadcastNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};