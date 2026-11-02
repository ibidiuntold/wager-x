import React from 'react';
import { X } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
}

interface NotificationsModalProps {
  onClose: () => void;
  notifications: Notification[];
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, notifications }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Message</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        {notifications.length > 0 ? (
          <ul className="space-y-2">
            {notifications.map((notification) => (
              <li key={notification.id} className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-gray-900 dark:text-white">
                {notification.message}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🙁</span>
            </div>
            <p className="text-gray-400">There are no unread messages</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;