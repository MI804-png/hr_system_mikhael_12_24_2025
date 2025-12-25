'use client';

import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useEffect, useState } from 'react';

export default function NotificationCenter() {
  const { user } = useAuth();
  const { getUserNotifications, markAsRead } = useNotification();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  const userNotifications = getUserNotifications(user.email);
  const unread = userNotifications.filter(n => !n.read);

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 border-blue-300 text-blue-800',
    success: 'bg-green-100 border-green-300 text-green-800',
    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    error: 'bg-red-100 border-red-300 text-red-800',
  };

  const typeIcons: Record<string, string> = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-gray-200 rounded-lg transition"
      >
        🔔
        {unread.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-lg">Notifications</h3>
            {unread.length > 0 && (
              <p className="text-sm text-gray-600">{unread.length} unread</p>
            )}
          </div>

          {userNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition ${
                    typeColors[notification.type]
                  } ${notification.read ? 'opacity-60' : 'font-semibold'}`}
                  onClick={() => {
                    markAsRead(notification.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{typeIcons[notification.type]}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <p className="text-xs mt-2 opacity-70">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
