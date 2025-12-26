'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/services/api/auth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
  };
};
