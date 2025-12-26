import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { APPayment } from '@/lib/types/accounting';

export interface APPaymentRow extends RowDataPacket {
  id: number;
  payment_number: string;
  invoice_id: number;
  payment_date: Date;
  payment_amount: number;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToPayment = (row: APPaymentRow): APPayment => ({
  id: row.id,
  paymentNumber: row.payment_number,
  invoiceId: row.invoice_id,
  paymentDate: row.payment_date,
  paymentAmount: row.payment_amount,
  paymentMethod: row.payment_method,
  referenceNumber: row.reference_number,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<APPayment | null> => {
  const row = await queryOne<APPaymentRow>(
    'SELECT * FROM ap_payments WHERE id = ?',
    [id]
  );
  return row ? mapRowToPayment(row) : null;
};

export const findByPaymentNumber = async (paymentNumber: string): Promise<APPayment | null> => {
  const row = await queryOne<APPaymentRow>(
    'SELECT * FROM ap_payments WHERE payment_number = ?',
    [paymentNumber]
  );
  return row ? mapRowToPayment(row) : null;
};

export const findByInvoice = async (invoiceId: number): Promise<APPayment[]> => {
  const rows = await query<APPaymentRow[]>(
    'SELECT * FROM ap_payments WHERE invoice_id = ? ORDER BY payment_date DESC',
    [invoiceId]
  );
  return rows.map(mapRowToPayment);
};

export const findAll = async (filters?: {
  invoiceId?: number;
  paymentMethod?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<APPayment[]> => {
  let sql = 'SELECT * FROM ap_payments WHERE 1=1';
  const params: any[] = [];

  if (filters?.invoiceId) {
    sql += ' AND invoice_id = ?';
    params.push(filters.invoiceId);
  }

  if (filters?.paymentMethod) {
    sql += ' AND payment_method = ?';
    params.push(filters.paymentMethod);
  }

  if (filters?.fromDate) {
    sql += ' AND payment_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND payment_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY payment_date DESC';

  const rows = await query<APPaymentRow[]>(sql, params);
  return rows.map(mapRowToPayment);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    invoiceId?: number;
    paymentMethod?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: APPayment[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.invoiceId) {
    whereClause += ' AND invoice_id = ?';
    params.push(filters.invoiceId);
  }

  if (filters?.paymentMethod) {
    whereClause += ' AND payment_method = ?';
    params.push(filters.paymentMethod);
  }

  if (filters?.fromDate) {
    whereClause += ' AND payment_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND payment_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM ap_payments${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<APPaymentRow[]>(
    `SELECT * FROM ap_payments${whereClause} 
     ORDER BY payment_date DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToPayment),
    total,
  };
};

export const create = async (data: {
  paymentNumber: string;
  invoiceId: number;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'other';
  referenceNumber?: string;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO ap_payments 
     (payment_number, invoice_id, payment_date, payment_amount, payment_method, reference_number, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.paymentNumber,
      data.invoiceId,
      data.paymentDate,
      data.paymentAmount,
      data.paymentMethod,
      data.referenceNumber,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const getTotalPaymentsByInvoice = async (invoiceId: number): Promise<number> => {
  const row = await queryOne<RowDataPacket>(
    'SELECT COALESCE(SUM(payment_amount), 0) as total FROM ap_payments WHERE invoice_id = ?',
    [invoiceId]
  );
  return row?.total || 0;
};
