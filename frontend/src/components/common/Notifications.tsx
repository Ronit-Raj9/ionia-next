'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks/hooks';
import { removeNotification } from '@/redux/slices/uiSlice';
import { RootState } from '@/redux/store';

export default function Notifications() {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state: RootState) => state.ui);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notifications[0].id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => {
        // Determine background color based on notification type
        let bgColor = 'bg-blue-500';
        if (notification.type === 'success') bgColor = 'bg-green-500';
        if (notification.type === 'error') bgColor = 'bg-red-500';
        if (notification.type === 'warning') bgColor = 'bg-yellow-500';

        return (
          <div
            key={notification.id}
            className={`${bgColor} text-white p-4 rounded-lg shadow-lg max-w-xs animate-fade-in`}
          >
            <div className="flex justify-between items-start">
              <p>{notification.message}</p>
              <button
                onClick={() => dispatch(removeNotification(notification.id))}
                className="ml-4 text-white hover:text-gray-200"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 