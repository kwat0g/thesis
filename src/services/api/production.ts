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

export const getProductionOrders = async (filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const queryString = params.toString();
  return apiCall(`/api/production/orders${queryString ? `?${queryString}` : ''}`);
};

export const getProductionOrderById = async (id: number) => {
  return apiCall(`/api/production/orders/${id}`);
};

export const createProductionOrder = async (data: any) => {
  return apiCall('/api/production/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProductionOrder = async (id: number, data: any) => {
  return apiCall(`/api/production/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const submitProductionOrderForApproval = async (id: number) => {
  return apiCall(`/api/production/orders/${id}/submit`, {
    method: 'POST',
  });
};

export const getProductionSchedules = async () => {
  return apiCall('/api/production/schedules');
};

export const getWorkOrders = async (filters?: {
  status?: string;
  productionOrderId?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.productionOrderId) params.append('productionOrderId', filters.productionOrderId.toString());

  const queryString = params.toString();
  return apiCall(`/api/production/work-orders${queryString ? `?${queryString}` : ''}`);
};

export const getWorkOrderById = async (id: number) => {
  return apiCall(`/api/production/work-orders/${id}`);
};

export const createWorkOrder = async (data: any) => {
  return apiCall('/api/production/work-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const recordWorkOrderOutput = async (id: number, data: any) => {
  return apiCall(`/api/production/work-orders/${id}/output`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
