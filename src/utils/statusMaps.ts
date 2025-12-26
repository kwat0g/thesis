export const PR_STATUS_MAP = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  converted_to_po: 'Converted to PO',
  cancelled: 'Cancelled',
} as const;

export const PO_STATUS_MAP = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  sent: 'Sent',
  partially_received: 'Partially Received',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled',
} as const;

export const PRODUCTION_ORDER_STATUS_MAP = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const WORK_ORDER_STATUS_MAP = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const PAYROLL_STATUS_MAP = {
  open: 'Open',
  calculated: 'Calculated',
  approved: 'Approved',
  released: 'Released',
  closed: 'Closed',
} as const;

export const INVOICE_STATUS_MAP = {
  pending: 'Pending',
  approved: 'Approved',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
} as const;

export const MAINTENANCE_WO_STATUS_MAP = {
  pending: 'Pending',
  approved: 'Approved',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
} as const;

export const MOLD_STATUS_MAP = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Maintenance',
  repair: 'Repair',
  retired: 'Retired',
} as const;
