import { BaseEntity } from './common';

export interface PayrollPeriod extends BaseEntity {
  periodCode: string;
  periodStart: Date;
  periodEnd: Date;
  paymentDate: Date;
  status: 'open' | 'calculated' | 'approved' | 'released' | 'closed';
  totalEmployees: number;
  totalAmount: number;
  preparedBy?: number;
  approvedBy?: number;
  releasedBy?: number;
}

export interface PayrollRecord extends BaseEntity {
  payrollPeriodId: number;
  employeeId: number;
  basicSalary: number;
  overtimePay: number;
  allowances: number;
  deductions: number;
  netPay: number;
  daysWorked: number;
  overtimeHours: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  notes?: string;
}

export interface APInvoice extends BaseEntity {
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: number;
  poId?: number;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'pending' | 'approved' | 'partially_paid' | 'paid' | 'overdue';
  paymentTerms?: string;
  notes?: string;
}

export interface APPayment extends BaseEntity {
  paymentNumber: string;
  invoiceId: number;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'other';
  referenceNumber?: string;
  notes?: string;
}
