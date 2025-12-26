/**
 * STANDARD ERP ERROR HANDLING
 * 
 * Provides consistent error responses across all API endpoints.
 * 
 * ARCHITECTURAL INTENT:
 * - Standardize error format for frontend consumption
 * - Enable error code-based handling in UI
 * - Support internationalization in the future
 * - Facilitate error tracking and monitoring
 */

export interface ERPErrorResponse {
  success: false;
  errorCode: string;
  message: string;
  details?: any;
}

/**
 * Base ERP Error class
 */
export class ERPError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(errorCode: string, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'ERPError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON(): ERPErrorResponse {
    return {
      success: false,
      errorCode: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * DOMAIN-SPECIFIC ERROR CODES
 */

// Authentication & Authorization Errors
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
} as const;

// Master Data Errors
export const MASTER_ERRORS = {
  ITEM_NOT_FOUND: 'MASTER_ITEM_NOT_FOUND',
  SUPPLIER_NOT_FOUND: 'MASTER_SUPPLIER_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'MASTER_CUSTOMER_NOT_FOUND',
  MACHINE_NOT_FOUND: 'MASTER_MACHINE_NOT_FOUND',
  WAREHOUSE_NOT_FOUND: 'MASTER_WAREHOUSE_NOT_FOUND',
  DUPLICATE_CODE: 'MASTER_DUPLICATE_CODE',
  CANNOT_DELETE_IN_USE: 'MASTER_CANNOT_DELETE_IN_USE',
} as const;

// Production Errors
export const PROD_ERRORS = {
  ORDER_NOT_FOUND: 'PROD_ORDER_NOT_FOUND',
  INVALID_STATUS: 'PROD_INVALID_STATUS',
  CANNOT_MODIFY_AFTER_SUBMISSION: 'PROD_CANNOT_MODIFY_AFTER_SUBMISSION',
  INSUFFICIENT_MATERIALS: 'PROD_INSUFFICIENT_MATERIALS',
  WORK_ORDER_NOT_FOUND: 'PROD_WORK_ORDER_NOT_FOUND',
  INVALID_QUANTITY: 'PROD_INVALID_QUANTITY',
} as const;

// MRP Errors
export const MRP_ERRORS = {
  RUN_NOT_FOUND: 'MRP_RUN_NOT_FOUND',
  INVALID_CUTOFF_DATE: 'MRP_INVALID_CUTOFF_DATE',
  NO_SHORTAGES_FOUND: 'MRP_NO_SHORTAGES_FOUND',
  ALREADY_GENERATED_PRS: 'MRP_ALREADY_GENERATED_PRS',
} as const;

// Purchasing Errors
export const PURCH_ERRORS = {
  PR_NOT_FOUND: 'PURCH_PR_NOT_FOUND',
  PO_NOT_FOUND: 'PURCH_PO_NOT_FOUND',
  INVALID_STATUS: 'PURCH_INVALID_STATUS',
  CANNOT_MODIFY_APPROVED: 'PURCH_CANNOT_MODIFY_APPROVED',
  NO_APPROVED_PR: 'PURCH_NO_APPROVED_PR',
  ALREADY_CONVERTED: 'PURCH_ALREADY_CONVERTED',
} as const;

// Inventory Errors
export const INV_ERRORS = {
  INSUFFICIENT_STOCK: 'INV_INSUFFICIENT_STOCK',
  BALANCE_NOT_FOUND: 'INV_BALANCE_NOT_FOUND',
  INVALID_TRANSACTION_TYPE: 'INV_INVALID_TRANSACTION_TYPE',
  NEGATIVE_QUANTITY: 'INV_NEGATIVE_QUANTITY',
  WAREHOUSE_MISMATCH: 'INV_WAREHOUSE_MISMATCH',
} as const;

// Quality Control Errors
export const QC_ERRORS = {
  INSPECTION_NOT_FOUND: 'QC_INSPECTION_NOT_FOUND',
  NCR_NOT_FOUND: 'QC_NCR_NOT_FOUND',
  INVALID_DISPOSITION: 'QC_INVALID_DISPOSITION',
  QUANTITY_MISMATCH: 'QC_QUANTITY_MISMATCH',
} as const;

// HR Errors
export const HR_ERRORS = {
  EMPLOYEE_NOT_FOUND: 'HR_EMPLOYEE_NOT_FOUND',
  ATTENDANCE_NOT_FOUND: 'HR_ATTENDANCE_NOT_FOUND',
  PAYROLL_NOT_FOUND: 'HR_PAYROLL_NOT_FOUND',
  INVALID_PAYROLL_STATUS: 'HR_INVALID_PAYROLL_STATUS',
  ALREADY_CALCULATED: 'HR_ALREADY_CALCULATED',
  NOT_CALCULATED: 'HR_NOT_CALCULATED',
} as const;

// Accounts Payable Errors
export const AP_ERRORS = {
  INVOICE_NOT_FOUND: 'AP_INVOICE_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'AP_PAYMENT_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'AP_INSUFFICIENT_BALANCE',
  OVERPAYMENT: 'AP_OVERPAYMENT',
  ALREADY_PAID: 'AP_ALREADY_PAID',
} as const;

// Maintenance Errors
export const MAINT_ERRORS = {
  SCHEDULE_NOT_FOUND: 'MAINT_SCHEDULE_NOT_FOUND',
  WORK_ORDER_NOT_FOUND: 'MAINT_WORK_ORDER_NOT_FOUND',
  INVALID_STATUS: 'MAINT_INVALID_STATUS',
  MACHINE_IN_USE: 'MAINT_MACHINE_IN_USE',
} as const;

// Mold Errors
export const MOLD_ERRORS = {
  MOLD_NOT_FOUND: 'MOLD_MOLD_NOT_FOUND',
  MOLD_IN_USE: 'MOLD_MOLD_IN_USE',
  MOLD_NOT_AVAILABLE: 'MOLD_MOLD_NOT_AVAILABLE',
  SHOT_LIMIT_EXCEEDED: 'MOLD_SHOT_LIMIT_EXCEEDED',
} as const;

// Dashboard Errors
export const DASH_ERRORS = {
  UNAUTHORIZED_ACCESS: 'DASH_UNAUTHORIZED_ACCESS',
  DATA_NOT_AVAILABLE: 'DASH_DATA_NOT_AVAILABLE',
} as const;

// Notification Errors
export const NOTIF_ERRORS = {
  NOTIFICATION_NOT_FOUND: 'NOTIF_NOTIFICATION_NOT_FOUND',
  ALREADY_READ: 'NOTIF_ALREADY_READ',
  INVALID_TYPE: 'NOTIF_INVALID_TYPE',
} as const;

// Validation Errors
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  INVALID_RANGE: 'VALIDATION_INVALID_RANGE',
  INVALID_DATE: 'VALIDATION_INVALID_DATE',
  INVALID_STATUS_TRANSITION: 'VALIDATION_INVALID_STATUS_TRANSITION',
} as const;

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  errorCode: string,
  message: string,
  details?: any
): ERPErrorResponse {
  return {
    success: false,
    errorCode,
    message,
    details,
  };
}

/**
 * Helper function to handle errors in API routes
 */
export function handleAPIError(error: any): { response: ERPErrorResponse; status: number } {
  if (error instanceof ERPError) {
    return {
      response: error.toJSON(),
      status: error.statusCode,
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      response: createErrorResponse(
        VALIDATION_ERRORS.INVALID_FORMAT,
        error.message
      ),
      status: 400,
    };
  }

  // Generic error
  return {
    response: createErrorResponse(
      'INTERNAL_ERROR',
      error.message || 'An unexpected error occurred'
    ),
    status: 500,
  };
}
