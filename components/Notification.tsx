import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Gift } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext'; 
type NotificationType = 'default' | 'destructive'; 

interface NotificationButton {
 text: string;
 link: string;
}

interface NotificationProps {
 id: string;
 title: string;
 message: string;
 type: NotificationType;
 buttons?: NotificationButton[];
 expiresAt?: Date;
 autoDismiss?: boolean;
 dismissDuration?: number;
 onClose: (id: string) => void;
}

export default function Notification({ userId }) {
  // Remove: const firestore = useFirestore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        } else {
          setError('Failed to fetch notifications');
        }
      } catch (err) {
        setError('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchNotifications();
  }, [userId]);

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification: any) => (
          <li key={notification.id}>{notification.message}</li>
        ))}
      </ul>
    </div>
  );
}
