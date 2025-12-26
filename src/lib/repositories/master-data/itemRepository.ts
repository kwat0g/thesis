import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Item } from '@/lib/types/master-data';

export interface ItemRow extends RowDataPacket {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  item_type: 'raw_material' | 'component' | 'finished_good' | 'consumable';
  uom_id: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_cost: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToItem = (row: ItemRow): Item => ({
  id: row.id,
  itemCode: row.item_code,
  itemName: row.item_name,
  description: row.description,
  itemType: row.item_type,
  uomId: row.uom_id,
  reorderLevel: row.reorder_level,
  reorderQuantity: row.reorder_quantity,
  unitCost: row.unit_cost,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<Item | null> => {
  const row = await queryOne<ItemRow>(
    'SELECT * FROM items WHERE id = ?',
    [id]
  );
  return row ? mapRowToItem(row) : null;
};

export const findByCode = async (itemCode: string): Promise<Item | null> => {
  const row = await queryOne<ItemRow>(
    'SELECT * FROM items WHERE item_code = ?',
    [itemCode]
  );
  return row ? mapRowToItem(row) : null;
};

export const findAll = async (filters?: {
  isActive?: boolean;
  itemType?: string;
}): Promise<Item[]> => {
  let sql = 'SELECT * FROM items WHERE 1=1';
  const params: any[] = [];

  if (filters?.isActive !== undefined) {
    sql += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  if (filters?.itemType) {
    sql += ' AND item_type = ?';
    params.push(filters.itemType);
  }

  sql += ' ORDER BY item_name';

  const rows = await query<ItemRow[]>(sql, params);
  return rows.map(mapRowToItem);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    isActive?: boolean;
    itemType?: string;
  }
): Promise<{ data: Item[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.isActive !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  if (filters?.itemType) {
    whereClause += ' AND item_type = ?';
    params.push(filters.itemType);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM items${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<ItemRow[]>(
    `SELECT * FROM items${whereClause} ORDER BY item_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToItem),
    total,
  };
};

export const create = async (data: {
  itemCode: string;
  itemName: string;
  description?: string;
  itemType: 'raw_material' | 'component' | 'finished_good' | 'consumable';
  uomId: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  unitCost?: number;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO items 
     (item_code, item_name, description, item_type, uom_id, reorder_level, reorder_quantity, unit_cost, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.itemCode,
      data.itemName,
      data.description,
      data.itemType,
      data.uomId,
      data.reorderLevel || 0,
      data.reorderQuantity || 0,
      data.unitCost || 0,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    itemName?: string;
    description?: string;
    itemType?: 'raw_material' | 'component' | 'finished_good' | 'consumable';
    uomId?: number;
    reorderLevel?: number;
    reorderQuantity?: number;
    unitCost?: number;
    isActive?: boolean;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.itemName !== undefined) {
    fields.push('item_name = ?');
    values.push(data.itemName);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.itemType !== undefined) {
    fields.push('item_type = ?');
    values.push(data.itemType);
  }
  if (data.uomId !== undefined) {
    fields.push('uom_id = ?');
    values.push(data.uomId);
  }
  if (data.reorderLevel !== undefined) {
    fields.push('reorder_level = ?');
    values.push(data.reorderLevel);
  }
  if (data.reorderQuantity !== undefined) {
    fields.push('reorder_quantity = ?');
    values.push(data.reorderQuantity);
  }
  if (data.unitCost !== undefined) {
    fields.push('unit_cost = ?');
    values.push(data.unitCost);
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(data.isActive);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE items SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteItem = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM items WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: false, updatedBy });
};

export const activate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: true, updatedBy });
};
