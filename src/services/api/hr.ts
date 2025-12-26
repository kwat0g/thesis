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

// Employees
export const getEmployees = async (filters?: {
  departmentId?: number;
  isActive?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.departmentId) params.append('departmentId', filters.departmentId.toString());
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const queryString = params.toString();
  return apiCall(`/api/hr/employees${queryString ? `?${queryString}` : ''}`);
};

export const getEmployeeById = async (id: number) => {
  return apiCall(`/api/hr/employees/${id}`);
};

// Attendance
export const getAttendanceRecords = async (filters?: {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return apiCall(`/api/hr/attendance${queryString ? `?${queryString}` : ''}`);
};

export const createAttendanceRecord = async (data: any) => {
  return apiCall('/api/hr/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Payroll
export const getPayrollPeriods = async (filters?: {
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  return apiCall(`/api/hr/payroll/periods${queryString ? `?${queryString}` : ''}`);
};

export const getPayrollPeriodById = async (id: number) => {
  return apiCall(`/api/hr/payroll/periods/${id}`);
};

export const createPayrollPeriod = async (data: any) => {
  return apiCall('/api/hr/payroll/periods', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const calculatePayroll = async (periodId: number) => {
  return apiCall(`/api/hr/payroll/periods/${periodId}/calculate`, {
    method: 'POST',
  });
};

export const submitPayrollForApproval = async (periodId: number) => {
  return apiCall(`/api/hr/payroll/periods/${periodId}/submit`, {
    method: 'POST',
  });
};
