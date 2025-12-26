'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/api/notifications';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { PriorityBadge } from '@/components/badges/PriorityBadge';
import { formatDateTime } from '@/utils/formatters';
import { CheckIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: number;
  notificationType: string;
  title: string;
  message: string;
  priority: string;
  referenceType?: string;
  referenceId?: number;
  createdAt: string;
  recipientId: number;
  isRead: boolean;
  readAt?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readFilter, setReadFilter] = useState('unread');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getNotifications({
        isRead: readFilter === 'unread' ? false : readFilter === 'read' ? true : undefined,
        notificationType: typeFilter || undefined,
      });
      setNotifications(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [readFilter, typeFilter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      await fetchNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to mark all as read');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  if (error && notifications.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchNotifications} />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CheckIcon className="w-5 h-5 mr-2" />
            Mark All as Read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="APPROVAL_REQUIRED">Approval Required</option>
                <option value="LOW_STOCK_ALERT">Low Stock Alert</option>
                <option value="OVERDUE_INVOICE">Overdue Invoice</option>
                <option value="PRODUCTION_DELAY">Production Delay</option>
                <option value="OVERDUE_MAINTENANCE">Overdue Maintenance</option>
              </select>
            </div>
            <button
              onClick={fetchNotifications}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <PriorityBadge priority={notification.priority} />
                      <span className="text-xs text-gray-500">
                        {notification.notificationType.replace(/_/g, ' ')}
                      </span>
                      {!notification.isRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-gray-500">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
