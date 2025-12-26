import { getToken } from './auth';

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

export const getNotifications = async (filters?: {
  isRead?: boolean;
  notificationType?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
  if (filters?.notificationType) params.append('notificationType', filters.notificationType);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  return apiCall(`/api/notifications${queryString ? `?${queryString}` : ''}`);
};

export const getNotificationSummary = async () => {
  return apiCall('/api/notifications/summary');
};

export const markNotificationAsRead = async (id: number) => {
  return apiCall(`/api/notifications/${id}/read`, {
    method: 'POST',
  });
};

export const markAllNotificationsAsRead = async () => {
  return apiCall('/api/notifications/mark-all-read', {
    method: 'POST',
  });
};
