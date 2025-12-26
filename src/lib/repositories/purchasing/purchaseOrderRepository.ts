import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { PurchaseOrder, PurchaseOrderLine } from '@/lib/types/purchasing';

export interface PurchaseOrderRow extends RowDataPacket {
  id: number;
  po_number: string;
  pr_id?: number;
  supplier_id: number;
  order_date: Date;
  expected_delivery_date: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
  total_amount: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface PurchaseOrderLineRow extends RowDataPacket {
  id: number;
  po_id: number;
  line_number: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const mapRowToPO = (row: PurchaseOrderRow): PurchaseOrder => ({
  id: row.id,
  poNumber: row.po_number,
  prId: row.pr_id,
  supplierId: row.supplier_id,
  poDate: row.order_date,
  expectedDeliveryDate: row.expected_delivery_date,
  status: row.status,
  approvalStatus: row.approval_status,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  rejectionReason: row.rejection_reason,
  totalAmount: row.total_amount,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

const mapRowToPOLine = (row: PurchaseOrderLineRow): PurchaseOrderLine => ({
  id: row.id,
  poId: row.po_id,
  lineNumber: row.line_number,
  itemId: row.item_id,
  quantity: row.quantity,
  quantityOrdered: row.quantity_ordered,
  quantityReceived: row.quantity_received,
  unitPrice: row.unit_price,
  lineTotal: row.line_total,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findById = async (id: number): Promise<PurchaseOrder | null> => {
  const row = await queryOne<PurchaseOrderRow>(
    'SELECT * FROM purchase_orders WHERE id = ?',
    [id]
  );
  return row ? mapRowToPO(row) : null;
};

export const findByPONumber = async (poNumber: string): Promise<PurchaseOrder | null> => {
  const row = await queryOne<PurchaseOrderRow>(
    'SELECT * FROM purchase_orders WHERE po_number = ?',
    [poNumber]
  );
  return row ? mapRowToPO(row) : null;
};

export const findByPR = async (prId: number): Promise<PurchaseOrder | null> => {
  const row = await queryOne<PurchaseOrderRow>(
    'SELECT * FROM purchase_orders WHERE pr_id = ?',
    [prId]
  );
  return row ? mapRowToPO(row) : null;
};

export const findAll = async (filters?: {
  status?: string;
  approvalStatus?: string;
  supplierId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<PurchaseOrder[]> => {
  let sql = 'SELECT * FROM purchase_orders WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.approvalStatus) {
    sql += ' AND approval_status = ?';
    params.push(filters.approvalStatus);
  }

  if (filters?.supplierId) {
    sql += ' AND supplier_id = ?';
    params.push(filters.supplierId);
  }

  if (filters?.fromDate) {
    sql += ' AND order_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND order_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY order_date DESC, created_at DESC';

  const rows = await query<PurchaseOrderRow[]>(sql, params);
  return rows.map(mapRowToPO);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    approvalStatus?: string;
    supplierId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: PurchaseOrder[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.approvalStatus) {
    whereClause += ' AND approval_status = ?';
    params.push(filters.approvalStatus);
  }

  if (filters?.supplierId) {
    whereClause += ' AND supplier_id = ?';
    params.push(filters.supplierId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND order_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND order_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM purchase_orders${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<PurchaseOrderRow[]>(
    `SELECT * FROM purchase_orders${whereClause} 
     ORDER BY order_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToPO),
    total,
  };
};

export const findLinesByPO = async (poId: number): Promise<PurchaseOrderLine[]> => {
  const rows = await query<PurchaseOrderLineRow[]>(
    'SELECT * FROM purchase_order_lines WHERE po_id = ? ORDER BY line_number',
    [poId]
  );
  return rows.map(mapRowToPOLine);
};

export const create = async (data: {
  poNumber: string;
  prId?: number;
  supplierId: number;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status?: 'draft' | 'pending_approval';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  totalAmount?: number;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO purchase_orders 
     (po_number, pr_id, supplier_id, order_date, expected_delivery_date, status, approval_status, total_amount, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.poNumber,
      data.prId,
      data.supplierId,
      data.orderDate,
      data.expectedDeliveryDate,
      data.status || 'draft',
      data.approvalStatus || 'pending',
      data.totalAmount || 0,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const createLine = async (data: {
  poId: number;
  lineNumber: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO purchase_order_lines 
     (po_id, line_number, item_id, quantity, unit_price, line_total, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.poId, data.lineNumber, data.itemId, data.quantity, data.unitPrice, data.lineTotal, data.notes]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    supplierId?: number;
    expectedDeliveryDate?: Date;
    status?: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvedBy?: number;
    approvedAt?: Date;
    rejectionReason?: string;
    totalAmount?: number;
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.supplierId !== undefined) {
    fields.push('supplier_id = ?');
    values.push(data.supplierId);
  }
  if (data.expectedDeliveryDate !== undefined) {
    fields.push('expected_delivery_date = ?');
    values.push(data.expectedDeliveryDate);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.approvalStatus !== undefined) {
    fields.push('approval_status = ?');
    values.push(data.approvalStatus);
  }
  if (data.approvedBy !== undefined) {
    fields.push('approved_by = ?');
    values.push(data.approvedBy);
  }
  if (data.approvedAt !== undefined) {
    fields.push('approved_at = ?');
    values.push(data.approvedAt);
  }
  if (data.rejectionReason !== undefined) {
    fields.push('rejection_reason = ?');
    values.push(data.rejectionReason);
  }
  if (data.totalAmount !== undefined) {
    fields.push('total_amount = ?');
    values.push(data.totalAmount);
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
    `UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const updateLine = async (
  id: number,
  data: {
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
    notes?: string;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(data.quantity);
  }
  if (data.unitPrice !== undefined) {
    fields.push('unit_price = ?');
    values.push(data.unitPrice);
  }
  if (data.lineTotal !== undefined) {
    fields.push('line_total = ?');
    values.push(data.lineTotal);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE purchase_order_lines SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deletePO = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM purchase_orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteLine = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM purchase_order_lines WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteLinesByPO = async (poId: number): Promise<boolean> => {
  const result = await execute('DELETE FROM purchase_order_lines WHERE po_id = ?', [poId]);
  return result.affectedRows > 0;
};
