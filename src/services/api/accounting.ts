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

// AP Invoices
export const getAPInvoices = async (filters?: {
  status?: string;
  supplierId?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.supplierId) params.append('supplierId', filters.supplierId.toString());

  const queryString = params.toString();
  return apiCall(`/api/accounting/ap/invoices${queryString ? `?${queryString}` : ''}`);
};

export const getAPInvoiceById = async (id: number) => {
  return apiCall(`/api/accounting/ap/invoices/${id}`);
};

export const createAPInvoice = async (data: any) => {
  return apiCall('/api/accounting/ap/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// AP Payments
export const getAPPayments = async () => {
  return apiCall('/api/accounting/ap/payments');
};

export const createAPPayment = async (data: any) => {
  return apiCall('/api/accounting/ap/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Payroll Release
export const approvePayroll = async (periodId: number) => {
  return apiCall(`/api/hr/payroll/periods/${periodId}/approve`, {
    method: 'POST',
  });
};

export const releasePayroll = async (periodId: number) => {
  return apiCall(`/api/hr/payroll/periods/${periodId}/release`, {
    method: 'POST',
  });
};
