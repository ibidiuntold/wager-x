'use client';

import { Button } from "@/components/ui/button";
import { Bell, Loader2, X } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { NotificationErrorBoundary } from "./NotificationErrorBoundary";
import { Suspense, useRef, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationList() {
  const { notifications, markAsRead, removeNotification, markAllAsRead } = useNotification();
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Notifications</h4>
          {unreadNotifications.length > 0 && (
            <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs hover:text-primary"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      {/* Notification Items */}
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
            <Bell className="h-8 w-8 text-gray-400 mb-2" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id}
              className={`flex items-start gap-2 p-3 hover:bg-accent/50 rounded-lg transition-all duration-200 ${
                !notification.read ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 rounded-full opacity-60 hover:opacity-100"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(
                      typeof notification.createdAt === 'string' || typeof notification.createdAt === 'number'
                        ? new Date(notification.createdAt)
                        : (notification.createdAt as any)?.toDate?.()
                          ? (notification.createdAt as any).toDate()
                          : new Date(notification.createdAt as any),
                      { addSuffix: true }
                    )}
                  </span>
                  <div className="flex gap-1">
                    {notification.buttons?.map((button, index) => (
                      <Button 
                        key={index}
                        size="sm" 
                        variant="default" 
                        className="h-6 text-xs"
                        onClick={() => {
                          markAsRead(notification.id);
                          window.open(button.link, '_blank');
                        }}
                      >
                        {button.text}
                      </Button>
                    ))}
                    {!notification.read && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Get position of notification button to position dropdown correctly
  const [position, setPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
  }>({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen) {
      const notificationButton = document.querySelector('[aria-label="Notifications"]');
      if (notificationButton) {
        const rect = notificationButton.getBoundingClientRect();
        const dropdownWidth = 320; // w-80
        const viewportWidth = window.innerWidth;
        const gap = 8;

        // Prefer aligning to the right edge of the button
        const rightAligned = viewportWidth - rect.right;

        // If right-aligned would push it off the left edge, use left alignment instead
        if (rect.right - dropdownWidth < gap) {
          setPosition({
            top: rect.bottom + gap,
            left: Math.max(gap, rect.left),
          });
        } else {
          setPosition({
            top: rect.bottom + gap,
            right: Math.max(gap, rightAligned),
          });
        }
      }
    }
  }, [isOpen]);

  // Create dropdown portal
  const dropdownContent = isOpen && (
    <div 
      className="fixed z-[100000] overflow-hidden shadow-xl" 
      style={{
        top: `${position.top}px`,
        ...(position.left !== undefined
          ? { left: `${position.left}px` }
          : { right: `${position.right ?? 0}px` }),
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-80 bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
        style={{ 
          maxHeight: "calc(100vh - 140px)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
      >
        <NotificationErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <NotificationList />
          </Suspense>
        </NotificationErrorBoundary>
      </motion.div>
    </div>
  );

  // When dropdown is open, create backdrop to capture clicks outside
  const backdrop = isOpen && (
    <div 
      className="fixed inset-0 z-[99999]" 
      style={{ backgroundColor: 'transparent' }}
      onClick={onClose}
    />
  );

  if (!mounted) return null;

  return (
    <>
      {backdrop && createPortal(backdrop, document.body)}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}