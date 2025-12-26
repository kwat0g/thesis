import * as apInvoiceRepository from '@/lib/repositories/accounting/apInvoiceRepository';
import * as apPaymentRepository from '@/lib/repositories/accounting/apPaymentRepository';
import * as purchaseOrderRepository from '@/lib/repositories/purchasing/purchaseOrderRepository';
import * as supplierRepository from '@/lib/repositories/master-data/supplierRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { APInvoice } from '@/lib/types/accounting';
import { PaginatedResponse } from '@/lib/types/common';

export const getInvoiceById = async (id: number): Promise<APInvoice | null> => {
  return await apInvoiceRepository.findById(id);
};

export const getInvoiceByNumber = async (invoiceNumber: string): Promise<APInvoice | null> => {
  return await apInvoiceRepository.findByInvoiceNumber(invoiceNumber);
};

export const getInvoicesBySupplier = async (supplierId: number): Promise<APInvoice[]> => {
  return await apInvoiceRepository.findBySupplier(supplierId);
};

export const getInvoicesByPO = async (poId: number): Promise<APInvoice[]> => {
  return await apInvoiceRepository.findByPO(poId);
};

export const getAllInvoices = async (filters?: {
  supplierId?: number;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  overdue?: boolean;
}): Promise<APInvoice[]> => {
  return await apInvoiceRepository.findAll(filters);
};

export const getInvoicesPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    supplierId?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    overdue?: boolean;
  }
): Promise<PaginatedResponse<APInvoice>> => {
  const { data, total } = await apInvoiceRepository.findPaginated(page, pageSize, filters);
  
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

const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `INV-${year}${month}${day}-${time}`;
};

export const createInvoice = async (
  data: {
    supplierInvoiceNumber?: string;
    supplierId: number;
    poId?: number;
    invoiceDate: Date;
    dueDate: Date;
    totalAmount: number;
    paymentTerms?: string;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const supplier = await supplierRepository.findById(data.supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  if (!supplier.isActive) {
    throw new Error('Cannot create invoice for inactive supplier');
  }

  if (data.poId) {
    const po = await purchaseOrderRepository.findById(data.poId);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.supplierId !== data.supplierId) {
      throw new Error('Purchase order supplier does not match invoice supplier');
    }

    if (po.status !== 'approved' && po.status !== 'sent' && po.status !== 'partially_received' && po.status !== 'received') {
      throw new Error('Can only create invoice from approved or received purchase orders');
    }
  }

  if (data.totalAmount <= 0) {
    throw new Error('Invoice total amount must be greater than 0');
  }

  if (data.dueDate < data.invoiceDate) {
    throw new Error('Due date cannot be before invoice date');
  }

  const invoiceNumber = generateInvoiceNumber();

  const invoiceId = await apInvoiceRepository.create({
    invoiceNumber,
    supplierInvoiceNumber: data.supplierInvoiceNumber,
    supplierId: data.supplierId,
    poId: data.poId,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    totalAmount: data.totalAmount,
    paymentTerms: data.paymentTerms,
    notes: data.notes,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_AP_INVOICE',
    module: 'ACCOUNTS_PAYABLE',
    recordType: 'ap_invoice',
    recordId: invoiceId,
    newValues: {
      invoiceNumber,
      supplierId: data.supplierId,
      poId: data.poId,
      totalAmount: data.totalAmount,
    },
  });

  return invoiceId;
};

export const createInvoiceFromPO = async (
  poId: number,
  data: {
    supplierInvoiceNumber?: string;
    invoiceDate: Date;
    dueDate: Date;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const po = await purchaseOrderRepository.findById(poId);
  if (!po) {
    throw new Error('Purchase order not found');
  }

  if (po.status !== 'approved' && po.status !== 'sent' && po.status !== 'partially_received' && po.status !== 'received') {
    throw new Error('Can only create invoice from approved or received purchase orders');
  }

  const existingInvoices = await apInvoiceRepository.findByPO(poId);
  if (existingInvoices.length > 0) {
    throw new Error('Invoice already exists for this purchase order');
  }

  return await createInvoice(
    {
      supplierInvoiceNumber: data.supplierInvoiceNumber,
      supplierId: po.supplierId,
      poId: po.id,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      totalAmount: po.totalAmount,
      paymentTerms: po.paymentTerms,
      notes: data.notes,
    },
    createdBy
  );
};

export const approveInvoice = async (
  id: number,
  approvedBy?: number
): Promise<boolean> => {
  const invoice = await apInvoiceRepository.findById(id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'pending') {
    throw new Error('Only pending invoices can be approved');
  }

  const success = await apInvoiceRepository.update(id, {
    status: 'approved',
    updatedBy: approvedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: approvedBy,
      action: 'APPROVE_AP_INVOICE',
      module: 'ACCOUNTS_PAYABLE',
      recordType: 'ap_invoice',
      recordId: id,
      oldValues: { status: 'pending' },
      newValues: { status: 'approved' },
    });
  }

  return success;
};

export const updateInvoiceStatus = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const invoice = await apInvoiceRepository.findById(id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  let newStatus: 'pending' | 'approved' | 'partially_paid' | 'paid' | 'overdue' = invoice.status;

  if (invoice.balance <= 0) {
    newStatus = 'paid';
  } else if (invoice.paidAmount > 0) {
    newStatus = 'partially_paid';
  } else if (new Date() > invoice.dueDate && invoice.status !== 'paid') {
    newStatus = 'overdue';
  }

  if (newStatus === invoice.status) {
    return false;
  }

  return await apInvoiceRepository.update(id, {
    status: newStatus,
    updatedBy,
  });
};

export const getOverdueInvoices = async (): Promise<APInvoice[]> => {
  const invoices = await apInvoiceRepository.findOverdueInvoices();
  
  for (const invoice of invoices) {
    if (invoice.status !== 'overdue') {
      await apInvoiceRepository.update(invoice.id, {
        status: 'overdue',
      });
    }
  }

  return invoices;
};

export const getAgingReport = async () => {
  const aging = await apInvoiceRepository.findAgingReport();
  
  const calculateTotal = (invoices: APInvoice[]) => 
    invoices.reduce((sum, inv) => sum + inv.balance, 0);

  return {
    current: {
      invoices: aging.current,
      count: aging.current.length,
      total: calculateTotal(aging.current),
    },
    days30: {
      invoices: aging.days30,
      count: aging.days30.length,
      total: calculateTotal(aging.days30),
    },
    days60: {
      invoices: aging.days60,
      count: aging.days60.length,
      total: calculateTotal(aging.days60),
    },
    days90Plus: {
      invoices: aging.days90Plus,
      count: aging.days90Plus.length,
      total: calculateTotal(aging.days90Plus),
    },
    grandTotal: calculateTotal([
      ...aging.current,
      ...aging.days30,
      ...aging.days60,
      ...aging.days90Plus,
    ]),
  };
};

export const getTotalOutstanding = async (supplierId?: number): Promise<number> => {
  return await apInvoiceRepository.getTotalOutstanding(supplierId);
};

export const getSupplierBalance = async (supplierId: number) => {
  const invoices = await apInvoiceRepository.findBySupplier(supplierId);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  
  const overdueInvoices = invoices.filter(inv => 
    new Date() > inv.dueDate && inv.status !== 'paid'
  );
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  return {
    supplierId,
    totalInvoices: invoices.length,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    overdueInvoices: overdueInvoices.length,
    totalOverdue,
  };
};
