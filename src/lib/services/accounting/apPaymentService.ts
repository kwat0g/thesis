import * as apPaymentRepository from '@/lib/repositories/accounting/apPaymentRepository';
import * as apInvoiceRepository from '@/lib/repositories/accounting/apInvoiceRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { APPayment } from '@/lib/types/accounting';
import { PaginatedResponse } from '@/lib/types/common';

export const getPaymentById = async (id: number): Promise<APPayment | null> => {
  return await apPaymentRepository.findById(id);
};

export const getPaymentByNumber = async (paymentNumber: string): Promise<APPayment | null> => {
  return await apPaymentRepository.findByPaymentNumber(paymentNumber);
};

export const getPaymentsByInvoice = async (invoiceId: number): Promise<APPayment[]> => {
  return await apPaymentRepository.findByInvoice(invoiceId);
};

export const getAllPayments = async (filters?: {
  invoiceId?: number;
  paymentMethod?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<APPayment[]> => {
  return await apPaymentRepository.findAll(filters);
};

export const getPaymentsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    invoiceId?: number;
    paymentMethod?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<APPayment>> => {
  const { data, total } = await apPaymentRepository.findPaginated(page, pageSize, filters);
  
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

const generatePaymentNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `PAY-${year}${month}${day}-${time}`;
};

export const createPayment = async (
  data: {
    invoiceId: number;
    paymentDate: Date;
    paymentAmount: number;
    paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'other';
    referenceNumber?: string;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const invoice = await apInvoiceRepository.findById(data.invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'pending') {
    throw new Error('Cannot make payment on pending invoice. Invoice must be approved first.');
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice is already fully paid');
  }

  if (data.paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  if (data.paymentAmount > invoice.balance) {
    throw new Error(`Payment amount (${data.paymentAmount}) exceeds invoice balance (${invoice.balance})`);
  }

  const paymentNumber = generatePaymentNumber();

  const paymentId = await apPaymentRepository.create({
    paymentNumber,
    invoiceId: data.invoiceId,
    paymentDate: data.paymentDate,
    paymentAmount: data.paymentAmount,
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber,
    notes: data.notes,
    createdBy,
  });

  const newPaidAmount = invoice.paidAmount + data.paymentAmount;
  const newBalance = invoice.totalAmount - newPaidAmount;
  
  let newStatus: 'approved' | 'partially_paid' | 'paid' = 'approved';
  if (newBalance <= 0) {
    newStatus = 'paid';
  } else if (newPaidAmount > 0) {
    newStatus = 'partially_paid';
  }

  await apInvoiceRepository.update(data.invoiceId, {
    paidAmount: newPaidAmount,
    balance: newBalance,
    status: newStatus,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_AP_PAYMENT',
    module: 'ACCOUNTS_PAYABLE',
    recordType: 'ap_payment',
    recordId: paymentId,
    newValues: {
      paymentNumber,
      invoiceId: data.invoiceId,
      paymentAmount: data.paymentAmount,
      paymentMethod: data.paymentMethod,
    },
  });

  return paymentId;
};

export const getInvoicePaymentHistory = async (invoiceId: number) => {
  const invoice = await apInvoiceRepository.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const payments = await apPaymentRepository.findByInvoice(invoiceId);
  const totalPayments = await apPaymentRepository.getTotalPaymentsByInvoice(invoiceId);

  return {
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balance: invoice.balance,
      status: invoice.status,
    },
    payments,
    paymentCount: payments.length,
    totalPaid: totalPayments,
    remainingBalance: invoice.balance,
  };
};

export const getPaymentSummary = async (filters?: {
  fromDate?: Date;
  toDate?: Date;
}) => {
  const payments = await apPaymentRepository.findAll(filters);
  
  const totalPayments = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
  
  const byMethod = {
    cash: payments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.paymentAmount, 0),
    check: payments.filter(p => p.paymentMethod === 'check').reduce((sum, p) => sum + p.paymentAmount, 0),
    bank_transfer: payments.filter(p => p.paymentMethod === 'bank_transfer').reduce((sum, p) => sum + p.paymentAmount, 0),
    other: payments.filter(p => p.paymentMethod === 'other').reduce((sum, p) => sum + p.paymentAmount, 0),
  };

  return {
    totalPayments: payments.length,
    totalAmount: totalPayments,
    byMethod,
    payments,
  };
};
