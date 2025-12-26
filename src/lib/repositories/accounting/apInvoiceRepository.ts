import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { APInvoice } from '@/lib/types/accounting';

export interface APInvoiceRow extends RowDataPacket {
  id: number;
  invoice_number: string;
  supplier_invoice_number?: string;
  supplier_id: number;
  po_id?: number;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'pending' | 'approved' | 'partially_paid' | 'paid' | 'overdue';
  payment_terms?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToInvoice = (row: APInvoiceRow): APInvoice => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  supplierInvoiceNumber: row.supplier_invoice_number,
  supplierId: row.supplier_id,
  poId: row.po_id,
  invoiceDate: row.invoice_date,
  dueDate: row.due_date,
  totalAmount: row.total_amount,
  paidAmount: row.paid_amount,
  balance: row.balance,
  status: row.status,
  paymentTerms: row.payment_terms,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<APInvoice | null> => {
  const row = await queryOne<APInvoiceRow>(
    'SELECT * FROM ap_invoices WHERE id = ?',
    [id]
  );
  return row ? mapRowToInvoice(row) : null;
};

export const findByInvoiceNumber = async (invoiceNumber: string): Promise<APInvoice | null> => {
  const row = await queryOne<APInvoiceRow>(
    'SELECT * FROM ap_invoices WHERE invoice_number = ?',
    [invoiceNumber]
  );
  return row ? mapRowToInvoice(row) : null;
};

export const findBySupplier = async (supplierId: number): Promise<APInvoice[]> => {
  const rows = await query<APInvoiceRow[]>(
    'SELECT * FROM ap_invoices WHERE supplier_id = ? ORDER BY invoice_date DESC',
    [supplierId]
  );
  return rows.map(mapRowToInvoice);
};

export const findByPO = async (poId: number): Promise<APInvoice[]> => {
  const rows = await query<APInvoiceRow[]>(
    'SELECT * FROM ap_invoices WHERE po_id = ? ORDER BY invoice_date DESC',
    [poId]
  );
  return rows.map(mapRowToInvoice);
};

export const findAll = async (filters?: {
  supplierId?: number;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  overdue?: boolean;
}): Promise<APInvoice[]> => {
  let sql = 'SELECT * FROM ap_invoices WHERE 1=1';
  const params: any[] = [];

  if (filters?.supplierId) {
    sql += ' AND supplier_id = ?';
    params.push(filters.supplierId);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    sql += ' AND invoice_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND invoice_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.overdue) {
    sql += ' AND due_date < CURDATE() AND status NOT IN (?, ?)';
    params.push('paid', 'overdue');
  }

  sql += ' ORDER BY invoice_date DESC';

  const rows = await query<APInvoiceRow[]>(sql, params);
  return rows.map(mapRowToInvoice);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    supplierId?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    overdue?: boolean;
  }
): Promise<{ data: APInvoice[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.supplierId) {
    whereClause += ' AND supplier_id = ?';
    params.push(filters.supplierId);
  }

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    whereClause += ' AND invoice_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND invoice_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.overdue) {
    whereClause += ' AND due_date < CURDATE() AND status NOT IN (?, ?)';
    params.push('paid', 'overdue');
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM ap_invoices${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<APInvoiceRow[]>(
    `SELECT * FROM ap_invoices${whereClause} 
     ORDER BY invoice_date DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToInvoice),
    total,
  };
};

export const create = async (data: {
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: number;
  poId?: number;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  paymentTerms?: string;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO ap_invoices 
     (invoice_number, supplier_invoice_number, supplier_id, po_id, invoice_date, 
      due_date, total_amount, balance, payment_terms, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.invoiceNumber,
      data.supplierInvoiceNumber,
      data.supplierId,
      data.poId,
      data.invoiceDate,
      data.dueDate,
      data.totalAmount,
      data.totalAmount,
      data.paymentTerms,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    supplierInvoiceNumber?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    totalAmount?: number;
    paidAmount?: number;
    balance?: number;
    status?: 'pending' | 'approved' | 'partially_paid' | 'paid' | 'overdue';
    paymentTerms?: string;
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.supplierInvoiceNumber !== undefined) {
    fields.push('supplier_invoice_number = ?');
    values.push(data.supplierInvoiceNumber);
  }
  if (data.invoiceDate !== undefined) {
    fields.push('invoice_date = ?');
    values.push(data.invoiceDate);
  }
  if (data.dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(data.dueDate);
  }
  if (data.totalAmount !== undefined) {
    fields.push('total_amount = ?');
    values.push(data.totalAmount);
  }
  if (data.paidAmount !== undefined) {
    fields.push('paid_amount = ?');
    values.push(data.paidAmount);
  }
  if (data.balance !== undefined) {
    fields.push('balance = ?');
    values.push(data.balance);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.paymentTerms !== undefined) {
    fields.push('payment_terms = ?');
    values.push(data.paymentTerms);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE ap_invoices SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const findOverdueInvoices = async (): Promise<APInvoice[]> => {
  const rows = await query<APInvoiceRow[]>(
    `SELECT * FROM ap_invoices 
     WHERE due_date < CURDATE() AND status NOT IN (?, ?)
     ORDER BY due_date ASC`,
    ['paid', 'overdue']
  );
  return rows.map(mapRowToInvoice);
};

export const findAgingReport = async (): Promise<{
  current: APInvoice[];
  days30: APInvoice[];
  days60: APInvoice[];
  days90Plus: APInvoice[];
}> => {
  const today = new Date();
  
  const current = await query<APInvoiceRow[]>(
    `SELECT * FROM ap_invoices 
     WHERE status NOT IN (?, ?) AND due_date >= CURDATE()
     ORDER BY due_date ASC`,
    ['paid', 'overdue']
  );

  const days30 = await query<APInvoiceRow[]>(
    `SELECT * FROM ap_invoices 
     WHERE status NOT IN (?, ?) 
     AND due_date < CURDATE() 
     AND due_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     ORDER BY due_date ASC`,
    ['paid', 'overdue']
  );

  const days60 = await query<APInvoiceRow[]>(
    `SELECT * FROM ap_invoices 
     WHERE status NOT IN (?, ?) 
     AND due_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     AND due_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
     ORDER BY due_date ASC`,
    ['paid', 'overdue']
  );

  const days90Plus = await query<APInvoiceRow[]>(
    `SELECT * FROM ap_invoices 
     WHERE status NOT IN (?, ?) 
     AND due_date < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
     ORDER BY due_date ASC`,
    ['paid', 'overdue']
  );

  return {
    current: current.map(mapRowToInvoice),
    days30: days30.map(mapRowToInvoice),
    days60: days60.map(mapRowToInvoice),
    days90Plus: days90Plus.map(mapRowToInvoice),
  };
};

export const getTotalOutstanding = async (supplierId?: number): Promise<number> => {
  let sql = 'SELECT COALESCE(SUM(balance), 0) as total FROM ap_invoices WHERE status != ?';
  const params: any[] = ['paid'];

  if (supplierId) {
    sql += ' AND supplier_id = ?';
    params.push(supplierId);
  }

  const row = await queryOne<RowDataPacket>(sql, params);
  return row?.total || 0;
};
