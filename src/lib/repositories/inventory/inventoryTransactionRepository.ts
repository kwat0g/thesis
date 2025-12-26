import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { InventoryTransaction } from '@/lib/types/inventory';

export interface InventoryTransactionRow extends RowDataPacket {
  id: number;
  transaction_date: Date;
  transaction_type: 'receipt' | 'issue' | 'adjustment' | 'transfer' | 'reservation' | 'unreservation';
  item_id: number;
  warehouse_id: number;
  quantity: number;
  status_from?: 'available' | 'reserved' | 'under_inspection' | 'rejected';
  status_to?: 'available' | 'reserved' | 'under_inspection' | 'rejected';
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: Date;
  created_by?: number;
}

const mapRowToTransaction = (row: InventoryTransactionRow): InventoryTransaction => ({
  id: row.id,
  transactionNumber: row.transaction_number || '',
  transactionDate: row.transaction_date,
  transactionType: row.transaction_type,
  itemId: row.item_id,
  warehouseId: row.warehouse_id,
  quantity: row.quantity,
  statusFrom: row.status_from,
  statusTo: row.status_to,
  referenceType: row.reference_type,
  referenceId: row.reference_id,
  notes: row.notes,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

export const findById = async (id: number): Promise<InventoryTransaction | null> => {
  const row = await queryOne<InventoryTransactionRow>(
    'SELECT * FROM inventory_transactions WHERE id = ?',
    [id]
  );
  return row ? mapRowToTransaction(row) : null;
};

export const findAll = async (filters?: {
  itemId?: number;
  warehouseId?: number;
  transactionType?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<InventoryTransaction[]> => {
  let sql = 'SELECT * FROM inventory_transactions WHERE 1=1';
  const params: any[] = [];

  if (filters?.itemId) {
    sql += ' AND item_id = ?';
    params.push(filters.itemId);
  }

  if (filters?.warehouseId) {
    sql += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  if (filters?.transactionType) {
    sql += ' AND transaction_type = ?';
    params.push(filters.transactionType);
  }

  if (filters?.fromDate) {
    sql += ' AND transaction_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND transaction_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY transaction_date DESC, created_at DESC';

  const rows = await query<InventoryTransactionRow[]>(sql, params);
  return rows.map(mapRowToTransaction);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    itemId?: number;
    warehouseId?: number;
    transactionType?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: InventoryTransaction[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.itemId) {
    whereClause += ' AND item_id = ?';
    params.push(filters.itemId);
  }

  if (filters?.warehouseId) {
    whereClause += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  if (filters?.transactionType) {
    whereClause += ' AND transaction_type = ?';
    params.push(filters.transactionType);
  }

  if (filters?.fromDate) {
    whereClause += ' AND transaction_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND transaction_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM inventory_transactions${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<InventoryTransactionRow[]>(
    `SELECT * FROM inventory_transactions${whereClause} 
     ORDER BY transaction_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToTransaction),
    total,
  };
};

export const create = async (data: {
  transactionDate: Date;
  transactionType: 'receipt' | 'issue' | 'adjustment' | 'transfer' | 'reservation' | 'unreservation';
  itemId: number;
  warehouseId: number;
  quantity: number;
  statusFrom?: 'available' | 'reserved' | 'under_inspection' | 'rejected';
  statusTo?: 'available' | 'reserved' | 'under_inspection' | 'rejected';
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO inventory_transactions 
     (transaction_date, transaction_type, item_id, warehouse_id, quantity, status_from, status_to, reference_type, reference_id, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.transactionDate,
      data.transactionType,
      data.itemId,
      data.warehouseId,
      data.quantity,
      data.statusFrom,
      data.statusTo,
      data.referenceType,
      data.referenceId,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};
