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

export const getQualityInspections = async (filters?: {
  inspectionType?: string;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.inspectionType) params.append('inspectionType', filters.inspectionType);
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  return apiCall(`/api/quality/inspections${queryString ? `?${queryString}` : ''}`);
};

export const getQualityInspectionById = async (id: number) => {
  return apiCall(`/api/quality/inspections/${id}`);
};

export const createQualityInspection = async (data: any) => {
  return apiCall('/api/quality/inspections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const recordInspectionResult = async (id: number, data: any) => {
  return apiCall(`/api/quality/inspections/${id}/result`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getNonConformanceReports = async () => {
  return apiCall('/api/quality/ncr');
};

export const createNonConformanceReport = async (data: any) => {
  return apiCall('/api/quality/ncr', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
