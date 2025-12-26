export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const TOKEN_KEY = 'erp_auth_token';
export const USER_KEY = 'erp_user_data';

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  sent: 'bg-purple-100 text-purple-800',
  overdue: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  partially_paid: 'bg-yellow-100 text-yellow-800',
  open: 'bg-gray-100 text-gray-800',
  closed: 'bg-gray-100 text-gray-800',
  calculated: 'bg-blue-100 text-blue-800',
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  repair: 'bg-orange-100 text-orange-800',
  retired: 'bg-gray-100 text-gray-800',
} as const;

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
} as const;
