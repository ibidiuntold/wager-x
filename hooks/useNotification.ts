'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export const useNotification = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch notifications');
      setNotifications(result.notifications);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Example: mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, status: 'read' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to mark as read');
      fetchNotifications();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark as read'));
      return false;
    }
  };

  // Add other notification operations as needed, using /api/notifications

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  };
};