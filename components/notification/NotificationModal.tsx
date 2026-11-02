import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, removeNotification } = useNotification();

  if (!isOpen) return null;

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
          {sortedNotifications.length === 0 ? (
            <p className="text-center py-4">No notifications</p>
          ) : (
            sortedNotifications.map((notification) => (
              <div key={notification.id} className={`p-4 border-b dark:border-gray-700 ${notification.read ? 'opacity-50' : ''}`}>
                <h3 className="font-semibold">{notification.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                <div className="mt-2 flex justify-between items-center">
                  <div className="flex space-x-2">
                  {notification.buttons && notification.buttons.map((button, index) => (
                      <a
                        key={index}
                        href={button.link}
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => markAsRead(notification.id)}
                      >
                        {button.text}
                      </a>
                    ))}
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;