'use client';

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count === 0) return null;
  
  return (
    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
      <span className="text-[10px] font-medium text-white">
        {count > 99 ? '99+' : count}
      </span>
    </div>
  );
}
