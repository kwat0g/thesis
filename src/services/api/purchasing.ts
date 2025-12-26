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

// Purchase Requests
export const getPurchaseRequests = async (filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  return apiCall(`/api/purchasing/requests${queryString ? `?${queryString}` : ''}`);
};

export const getPurchaseRequestById = async (id: number) => {
  return apiCall(`/api/purchasing/requests/${id}`);
};

export const createPurchaseRequest = async (data: any) => {
  return apiCall('/api/purchasing/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const submitPurchaseRequestForApproval = async (id: number) => {
  return apiCall(`/api/purchasing/requests/${id}/submit`, {
    method: 'POST',
  });
};

// Purchase Orders
export const getPurchaseOrders = async (filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  return apiCall(`/api/purchasing/orders${queryString ? `?${queryString}` : ''}`);
};

export const getPurchaseOrderById = async (id: number) => {
  return apiCall(`/api/purchasing/orders/${id}`);
};

export const createPurchaseOrder = async (data: any) => {
  return apiCall('/api/purchasing/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const submitPurchaseOrderForApproval = async (id: number) => {
  return apiCall(`/api/purchasing/orders/${id}/submit`, {
    method: 'POST',
  });
};

export const sendPurchaseOrder = async (id: number) => {
  return apiCall(`/api/purchasing/orders/${id}/send`, {
    method: 'POST',
  });
};
