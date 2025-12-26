import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { GoodsReceipt, GoodsReceiptLine } from '@/lib/types/inventory';

export interface GoodsReceiptRow extends RowDataPacket {
  id: number;
  gr_number: string;
  po_id: number;
  receipt_date: Date;
  warehouse_id: number;
  receiver_id: number;
  status: 'draft' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface GoodsReceiptLineRow extends RowDataPacket {
  id: number;
  gr_id: number;
  line_number: number;
  po_line_id: number;
  item_id: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const mapRowToGR = (row: GoodsReceiptRow): GoodsReceipt => ({
  id: row.id,
  grNumber: row.gr_number,
  poId: row.po_id,
  receiptDate: row.receipt_date,
  warehouseId: row.warehouse_id,
  receiverId: row.receiver_id,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

const mapRowToGRLine = (row: GoodsReceiptLineRow): GoodsReceiptLine => ({
  id: row.id,
  grId: row.gr_id,
  lineNumber: row.line_number,
  poLineId: row.po_line_id,
  itemId: row.item_id,
  quantityReceived: row.quantity_received,
  quantityAccepted: row.quantity_accepted,
  quantityRejected: row.quantity_rejected,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findById = async (id: number): Promise<GoodsReceipt | null> => {
  const row = await queryOne<GoodsReceiptRow>(
    'SELECT * FROM goods_receipts WHERE id = ?',
    [id]
  );
  return row ? mapRowToGR(row) : null;
};

export const findByGRNumber = async (grNumber: string): Promise<GoodsReceipt | null> => {
  const row = await queryOne<GoodsReceiptRow>(
    'SELECT * FROM goods_receipts WHERE gr_number = ?',
    [grNumber]
  );
  return row ? mapRowToGR(row) : null;
};

export const findByPO = async (poId: number): Promise<GoodsReceipt[]> => {
  const rows = await query<GoodsReceiptRow[]>(
    'SELECT * FROM goods_receipts WHERE po_id = ? ORDER BY receipt_date DESC',
    [poId]
  );
  return rows.map(mapRowToGR);
};

export const findAll = async (filters?: {
  status?: string;
  warehouseId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<GoodsReceipt[]> => {
  let sql = 'SELECT * FROM goods_receipts WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.warehouseId) {
    sql += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  if (filters?.fromDate) {
    sql += ' AND receipt_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND receipt_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY receipt_date DESC, created_at DESC';

  const rows = await query<GoodsReceiptRow[]>(sql, params);
  return rows.map(mapRowToGR);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    warehouseId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: GoodsReceipt[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.warehouseId) {
    whereClause += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND receipt_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND receipt_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM goods_receipts${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<GoodsReceiptRow[]>(
    `SELECT * FROM goods_receipts${whereClause} 
     ORDER BY receipt_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToGR),
    total,
  };
};

export const findLinesByGR = async (grId: number): Promise<GoodsReceiptLine[]> => {
  const rows = await query<GoodsReceiptLineRow[]>(
    'SELECT * FROM goods_receipt_lines WHERE gr_id = ? ORDER BY line_number',
    [grId]
  );
  return rows.map(mapRowToGRLine);
};

export const create = async (data: {
  grNumber: string;
  poId: number;
  receiptDate: Date;
  warehouseId: number;
  receiverId: number;
  status?: 'draft' | 'completed';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO goods_receipts 
     (gr_number, po_id, receipt_date, warehouse_id, receiver_id, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.grNumber,
      data.poId,
      data.receiptDate,
      data.warehouseId,
      data.receiverId,
      data.status || 'draft',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const createLine = async (data: {
  grId: number;
  lineNumber: number;
  poLineId: number;
  itemId: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  notes?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO goods_receipt_lines 
     (gr_id, line_number, po_line_id, item_id, quantity_received, quantity_accepted, quantity_rejected, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.grId,
      data.lineNumber,
      data.poLineId,
      data.itemId,
      data.quantityReceived,
      data.quantityAccepted,
      data.quantityRejected,
      data.notes,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    status?: 'draft' | 'completed' | 'cancelled';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
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
    `UPDATE goods_receipts SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteGR = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM goods_receipts WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteLinesByGR = async (grId: number): Promise<boolean> => {
  const result = await execute('DELETE FROM goods_receipt_lines WHERE gr_id = ?', [grId]);
  return result.affectedRows > 0;
};
