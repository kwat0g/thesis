import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { ProductionOrder } from '@/lib/types/production';

export interface ProductionOrderRow extends RowDataPacket {
  id: number;
  po_number: string;
  customer_po_reference?: string;
  item_id: number;
  quantity_ordered: number;
  quantity_produced: number;
  required_date: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'pending_approval' | 'approved' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  approved_by?: number;
  approved_at?: Date;
  released_by?: number;
  released_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToProductionOrder = (row: ProductionOrderRow): ProductionOrder => ({
  id: row.id,
  poNumber: row.po_number,
  customerPoReference: row.customer_po_reference,
  itemId: row.item_id,
  quantityOrdered: row.quantity_ordered,
  quantityProduced: row.quantity_produced,
  requiredDate: row.required_date,
  priority: row.priority,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<ProductionOrder | null> => {
  const row = await queryOne<ProductionOrderRow>(
    'SELECT * FROM production_orders WHERE id = ?',
    [id]
  );
  return row ? mapRowToProductionOrder(row) : null;
};

export const findByPoNumber = async (poNumber: string): Promise<ProductionOrder | null> => {
  const row = await queryOne<ProductionOrderRow>(
    'SELECT * FROM production_orders WHERE po_number = ?',
    [poNumber]
  );
  return row ? mapRowToProductionOrder(row) : null;
};

export const findAll = async (filters?: {
  status?: string;
  priority?: string;
  itemId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<ProductionOrder[]> => {
  let sql = 'SELECT * FROM production_orders WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.priority) {
    sql += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters?.itemId) {
    sql += ' AND item_id = ?';
    params.push(filters.itemId);
  }

  if (filters?.fromDate) {
    sql += ' AND required_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND required_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY required_date ASC, priority DESC, created_at DESC';

  const rows = await query<ProductionOrderRow[]>(sql, params);
  return rows.map(mapRowToProductionOrder);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    priority?: string;
    itemId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: ProductionOrder[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.priority) {
    whereClause += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters?.itemId) {
    whereClause += ' AND item_id = ?';
    params.push(filters.itemId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND required_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND required_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM production_orders${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<ProductionOrderRow[]>(
    `SELECT * FROM production_orders${whereClause} 
     ORDER BY required_date ASC, priority DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToProductionOrder),
    total,
  };
};

export const create = async (data: {
  poNumber: string;
  customerPoReference?: string;
  itemId: number;
  quantityOrdered: number;
  requiredDate: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  status?: 'draft' | 'pending_approval';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO production_orders 
     (po_number, customer_po_reference, item_id, quantity_ordered, required_date, priority, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.poNumber,
      data.customerPoReference,
      data.itemId,
      data.quantityOrdered,
      data.requiredDate,
      data.priority || 'normal',
      data.status || 'draft',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    customerPoReference?: string;
    itemId?: number;
    quantityOrdered?: number;
    requiredDate?: Date;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    status?: 'draft' | 'pending_approval' | 'approved' | 'released' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.customerPoReference !== undefined) {
    fields.push('customer_po_reference = ?');
    values.push(data.customerPoReference);
  }
  if (data.itemId !== undefined) {
    fields.push('item_id = ?');
    values.push(data.itemId);
  }
  if (data.quantityOrdered !== undefined) {
    fields.push('quantity_ordered = ?');
    values.push(data.quantityOrdered);
  }
  if (data.requiredDate !== undefined) {
    fields.push('required_date = ?');
    values.push(data.requiredDate);
  }
  if (data.priority !== undefined) {
    fields.push('priority = ?');
    values.push(data.priority);
  }
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
    `UPDATE production_orders SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const approve = async (
  id: number,
  approvedBy: number
): Promise<boolean> => {
  const result = await execute(
    `UPDATE production_orders 
     SET status = 'approved', approved_by = ?, approved_at = NOW(), updated_by = ?
     WHERE id = ?`,
    [approvedBy, approvedBy, id]
  );
  return result.affectedRows > 0;
};

export const release = async (
  id: number,
  releasedBy: number
): Promise<boolean> => {
  const result = await execute(
    `UPDATE production_orders 
     SET status = 'released', released_by = ?, released_at = NOW(), updated_by = ?
     WHERE id = ?`,
    [releasedBy, releasedBy, id]
  );
  return result.affectedRows > 0;
};

export const cancel = async (
  id: number,
  cancelledBy: number
): Promise<boolean> => {
  const result = await execute(
    `UPDATE production_orders 
     SET status = 'cancelled', updated_by = ?
     WHERE id = ?`,
    [cancelledBy, id]
  );
  return result.affectedRows > 0;
};

export const updateQuantityProduced = async (
  id: number,
  quantityProduced: number
): Promise<boolean> => {
  const result = await execute(
    `UPDATE production_orders 
     SET quantity_produced = ?
     WHERE id = ?`,
    [quantityProduced, id]
  );
  return result.affectedRows > 0;
};

export const deleteProductionOrder = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM production_orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
