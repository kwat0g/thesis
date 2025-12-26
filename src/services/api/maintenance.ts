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

// Maintenance Schedules
export const getMaintenanceSchedules = async (filters?: {
  machineId?: number;
  isActive?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.machineId) params.append('machineId', filters.machineId.toString());
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const queryString = params.toString();
  return apiCall(`/api/maintenance/schedules${queryString ? `?${queryString}` : ''}`);
};

export const getMaintenanceScheduleById = async (id: number) => {
  return apiCall(`/api/maintenance/schedules/${id}`);
};

export const createMaintenanceSchedule = async (data: any) => {
  return apiCall('/api/maintenance/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Maintenance Work Orders
export const getMaintenanceWorkOrders = async (filters?: {
  status?: string;
  maintenanceType?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.maintenanceType) params.append('maintenanceType', filters.maintenanceType);

  const queryString = params.toString();
  return apiCall(`/api/maintenance/work-orders${queryString ? `?${queryString}` : ''}`);
};

export const getMaintenanceWorkOrderById = async (id: number) => {
  return apiCall(`/api/maintenance/work-orders/${id}`);
};

export const createMaintenanceWorkOrder = async (data: any) => {
  return apiCall('/api/maintenance/work-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const submitMaintenanceWorkOrderForApproval = async (id: number) => {
  return apiCall(`/api/maintenance/work-orders/${id}/submit`, {
    method: 'POST',
  });
};

export const completeMaintenanceWorkOrder = async (id: number, data: any) => {
  return apiCall(`/api/maintenance/work-orders/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
