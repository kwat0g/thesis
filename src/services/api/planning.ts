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

export const getMRPRuns = async () => {
  return apiCall('/api/planning/mrp/runs');
};

export const getMRPRunById = async (id: number) => {
  return apiCall(`/api/planning/mrp/runs/${id}`);
};

export const executeMRP = async (data: { cutoffDate: string; leadTimeDays?: number }) => {
  return apiCall('/api/planning/mrp/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const generatePRsFromMRP = async (runId: number) => {
  return apiCall(`/api/planning/mrp/runs/${runId}/generate-prs`, {
    method: 'POST',
  });
};

export const getProductionSchedules = async () => {
  return apiCall('/api/production/schedules');
};
