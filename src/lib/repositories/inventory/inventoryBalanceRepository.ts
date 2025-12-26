import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { InventoryBalance } from '@/lib/types/inventory';

export interface InventoryBalanceRow extends RowDataPacket {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity_available: number;
  quantity_reserved: number;
  quantity_under_inspection: number;
  quantity_rejected: number;
  last_updated: Date;
}

const mapRowToBalance = (row: InventoryBalanceRow): InventoryBalance => ({
  id: row.id,
  itemId: row.item_id,
  warehouseId: row.warehouse_id,
  quantityAvailable: row.quantity_available,
  quantityReserved: row.quantity_reserved,
  quantityInspection: row.quantity_under_inspection,
  quantityRejected: row.quantity_rejected,
  lastUpdated: row.last_updated,
});

export const findById = async (id: number): Promise<InventoryBalance | null> => {
  const row = await queryOne<InventoryBalanceRow>(
    'SELECT * FROM inventory_balances WHERE id = ?',
    [id]
  );
  return row ? mapRowToBalance(row) : null;
};

export const findByItemAndWarehouse = async (
  itemId: number,
  warehouseId: number
): Promise<InventoryBalance | null> => {
  const row = await queryOne<InventoryBalanceRow>(
    'SELECT * FROM inventory_balances WHERE item_id = ? AND warehouse_id = ?',
    [itemId, warehouseId]
  );
  return row ? mapRowToBalance(row) : null;
};

export const findByItem = async (itemId: number): Promise<InventoryBalance[]> => {
  const rows = await query<InventoryBalanceRow[]>(
    'SELECT * FROM inventory_balances WHERE item_id = ? ORDER BY warehouse_id',
    [itemId]
  );
  return rows.map(mapRowToBalance);
};

export const findByWarehouse = async (warehouseId: number): Promise<InventoryBalance[]> => {
  const rows = await query<InventoryBalanceRow[]>(
    'SELECT * FROM inventory_balances WHERE warehouse_id = ? ORDER BY item_id',
    [warehouseId]
  );
  return rows.map(mapRowToBalance);
};

export const findAll = async (filters?: {
  itemId?: number;
  warehouseId?: number;
}): Promise<InventoryBalance[]> => {
  let sql = 'SELECT * FROM inventory_balances WHERE 1=1';
  const params: any[] = [];

  if (filters?.itemId) {
    sql += ' AND item_id = ?';
    params.push(filters.itemId);
  }

  if (filters?.warehouseId) {
    sql += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  sql += ' ORDER BY item_id, warehouse_id';

  const rows = await query<InventoryBalanceRow[]>(sql, params);
  return rows.map(mapRowToBalance);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    itemId?: number;
    warehouseId?: number;
  }
): Promise<{ data: InventoryBalance[]; total: number }> => {
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

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM inventory_balances${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<InventoryBalanceRow[]>(
    `SELECT * FROM inventory_balances${whereClause} 
     ORDER BY item_id, warehouse_id 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToBalance),
    total,
  };
};

export const createOrUpdate = async (data: {
  itemId: number;
  warehouseId: number;
  quantityAvailable?: number;
  quantityReserved?: number;
  quantityInspection?: number;
  quantityRejected?: number;
}): Promise<number> => {
  const existing = await findByItemAndWarehouse(data.itemId, data.warehouseId);

  if (existing) {
    await execute(
      `UPDATE inventory_balances 
       SET quantity_available = ?, quantity_reserved = ?, quantity_under_inspection = ?, quantity_rejected = ?, last_updated = NOW()
       WHERE item_id = ? AND warehouse_id = ?`,
      [
        data.quantityAvailable ?? existing.quantityAvailable,
        data.quantityReserved ?? existing.quantityReserved,
        data.quantityInspection ?? existing.quantityInspection,
        data.quantityRejected ?? existing.quantityRejected,
        data.itemId,
        data.warehouseId,
      ]
    );
    return existing.id;
  } else {
    const result = await execute(
      `INSERT INTO inventory_balances 
       (item_id, warehouse_id, quantity_available, quantity_reserved, quantity_under_inspection, quantity_rejected)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.itemId,
        data.warehouseId,
        data.quantityAvailable || 0,
        data.quantityReserved || 0,
        data.quantityInspection || 0,
        data.quantityRejected || 0,
      ]
    );
    return result.insertId;
  }
};

export const adjustQuantity = async (
  itemId: number,
  warehouseId: number,
  field: 'quantityAvailable' | 'quantityReserved' | 'quantityInspection' | 'quantityRejected',
  delta: number
): Promise<boolean> => {
  const columnMap = {
    quantityAvailable: 'quantity_available',
    quantityReserved: 'quantity_reserved',
    quantityInspection: 'quantity_under_inspection',
    quantityRejected: 'quantity_rejected',
  };

  const column = columnMap[field];

  const result = await execute(
    `UPDATE inventory_balances 
     SET ${column} = ${column} + ?, last_updated = NOW()
     WHERE item_id = ? AND warehouse_id = ?`,
    [delta, itemId, warehouseId]
  );

  return result.affectedRows > 0;
};

export const getAvailableQuantity = async (
  itemId: number,
  warehouseId?: number
): Promise<number> => {
  if (warehouseId) {
    const balance = await findByItemAndWarehouse(itemId, warehouseId);
    return balance?.quantityAvailable || 0;
  } else {
    const balances = await findByItem(itemId);
    return balances.reduce((sum, b) => sum + b.quantityAvailable, 0);
  }
};

export const getTotalQuantity = async (
  itemId: number,
  warehouseId?: number
): Promise<{
  available: number;
  reserved: number;
  underInspection: number;
  rejected: number;
  total: number;
}> => {
  let balances: InventoryBalance[];
  
  if (warehouseId) {
    const balance = await findByItemAndWarehouse(itemId, warehouseId);
    balances = balance ? [balance] : [];
  } else {
    balances = await findByItem(itemId);
  }

  const available = balances.reduce((sum, b) => sum + b.quantityAvailable, 0);
  const reserved = balances.reduce((sum, b) => sum + b.quantityReserved, 0);
  const underInspection = balances.reduce((sum, b) => sum + b.quantityInspection, 0);
  const rejected = balances.reduce((sum, b) => sum + b.quantityRejected, 0);

  return {
    available,
    reserved,
    underInspection,
    rejected,
    total: available + reserved + underInspection + rejected,
  };
};
