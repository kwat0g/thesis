import { getToken } from './auth';

const fetchDashboard = async (endpoint: string) => {
  const token = getToken();
  const response = await fetch(`/api/dashboard/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch dashboard data');
  }

  return data.data;
};

export const getProductionDashboard = () => fetchDashboard('production');
export const getInventoryDashboard = () => fetchDashboard('inventory');
export const getPurchasingDashboard = () => fetchDashboard('purchasing');
export const getAccountingDashboard = () => fetchDashboard('accounting');
export const getMaintenanceDashboard = () => fetchDashboard('maintenance');
export const getExecutiveSummary = () => fetchDashboard('executive-summary');
