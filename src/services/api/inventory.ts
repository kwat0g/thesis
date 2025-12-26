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

// Inventory Balances
export const getInventoryBalances = async (filters?: {
  warehouseId?: number;
  itemId?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId.toString());
  if (filters?.itemId) params.append('itemId', filters.itemId.toString());

  const queryString = params.toString();
  return apiCall(`/api/inventory/balances${queryString ? `?${queryString}` : ''}`);
};

// Goods Receipt
export const getGoodsReceipts = async () => {
  return apiCall('/api/inventory/receipts');
};

export const createGoodsReceipt = async (data: any) => {
  return apiCall('/api/inventory/receipts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Goods Issue
export const getGoodsIssues = async () => {
  return apiCall('/api/inventory/issues');
};

export const createGoodsIssue = async (data: any) => {
  return apiCall('/api/inventory/issues', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Inventory Transactions
export const getInventoryTransactions = async (filters?: {
  itemId?: number;
  warehouseId?: number;
  transactionType?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.itemId) params.append('itemId', filters.itemId.toString());
  if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId.toString());
  if (filters?.transactionType) params.append('transactionType', filters.transactionType);

  const queryString = params.toString();
  return apiCall(`/api/inventory/transactions${queryString ? `?${queryString}` : ''}`);
};
