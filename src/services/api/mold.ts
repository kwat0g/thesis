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

export const getMolds = async (filters?: {
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  return apiCall(`/api/molds${queryString ? `?${queryString}` : ''}`);
};

export const getMoldById = async (id: number) => {
  return apiCall(`/api/molds/${id}`);
};

export const createMold = async (data: any) => {
  return apiCall('/api/molds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateMoldStatus = async (id: number, status: string) => {
  return apiCall(`/api/molds/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const assignMoldToWorkOrder = async (moldId: number, workOrderId: number) => {
  return apiCall(`/api/molds/${moldId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ workOrderId }),
  });
};

export const recordMoldUsage = async (moldId: number, data: any) => {
  return apiCall(`/api/molds/${moldId}/usage`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getMoldUsageHistory = async (moldId: number) => {
  return apiCall(`/api/molds/${moldId}/usage-history`);
};
