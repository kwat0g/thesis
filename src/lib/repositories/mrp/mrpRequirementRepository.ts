import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';

export interface MRPRequirement {
  id: number;
  mrpRunId: number;
  productionOrderId: number;
  itemId: number;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  requiredDate: Date;
  status: 'sufficient' | 'shortage' | 'pr_created';
  prId?: number;
  createdAt: Date;
}

export interface MRPRequirementRow extends RowDataPacket {
  id: number;
  mrp_run_id: number;
  production_order_id: number;
  item_id: number;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  required_date: Date;
  status: 'sufficient' | 'shortage' | 'pr_created';
  pr_id?: number;
  created_at: Date;
}

const mapRowToRequirement = (row: MRPRequirementRow): MRPRequirement => ({
  id: row.id,
  mrpRunId: row.mrp_run_id,
  productionOrderId: row.production_order_id,
  itemId: row.item_id,
  requiredQuantity: row.required_quantity,
  availableQuantity: row.available_quantity,
  shortageQuantity: row.shortage_quantity,
  requiredDate: row.required_date,
  status: row.status,
  prId: row.pr_id,
  createdAt: row.created_at,
});

export const findById = async (id: number): Promise<MRPRequirement | null> => {
  const row = await queryOne<MRPRequirementRow>(
    'SELECT * FROM mrp_requirements WHERE id = ?',
    [id]
  );
  return row ? mapRowToRequirement(row) : null;
};

export const findByMRPRun = async (mrpRunId: number): Promise<MRPRequirement[]> => {
  const rows = await query<MRPRequirementRow[]>(
    'SELECT * FROM mrp_requirements WHERE mrp_run_id = ? ORDER BY required_date, item_id',
    [mrpRunId]
  );
  return rows.map(mapRowToRequirement);
};

export const findShortagesByMRPRun = async (mrpRunId: number): Promise<MRPRequirement[]> => {
  const rows = await query<MRPRequirementRow[]>(
    `SELECT * FROM mrp_requirements 
     WHERE mrp_run_id = ? AND status IN ('shortage', 'pr_created')
     ORDER BY required_date, item_id`,
    [mrpRunId]
  );
  return rows.map(mapRowToRequirement);
};

export const findAll = async (filters?: {
  mrpRunId?: number;
  status?: string;
  itemId?: number;
}): Promise<MRPRequirement[]> => {
  let sql = 'SELECT * FROM mrp_requirements WHERE 1=1';
  const params: any[] = [];

  if (filters?.mrpRunId) {
    sql += ' AND mrp_run_id = ?';
    params.push(filters.mrpRunId);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.itemId) {
    sql += ' AND item_id = ?';
    params.push(filters.itemId);
  }

  sql += ' ORDER BY required_date, item_id';

  const rows = await query<MRPRequirementRow[]>(sql, params);
  return rows.map(mapRowToRequirement);
};

export const create = async (data: {
  mrpRunId: number;
  productionOrderId: number;
  itemId: number;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  requiredDate: Date;
  status: 'sufficient' | 'shortage' | 'pr_created';
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO mrp_requirements 
     (mrp_run_id, production_order_id, item_id, required_quantity, available_quantity, shortage_quantity, required_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.mrpRunId,
      data.productionOrderId,
      data.itemId,
      data.requiredQuantity,
      data.availableQuantity,
      data.shortageQuantity,
      data.requiredDate,
      data.status,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    availableQuantity?: number;
    shortageQuantity?: number;
    status?: 'sufficient' | 'shortage' | 'pr_created';
    prId?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.availableQuantity !== undefined) {
    fields.push('available_quantity = ?');
    values.push(data.availableQuantity);
  }
  if (data.shortageQuantity !== undefined) {
    fields.push('shortage_quantity = ?');
    values.push(data.shortageQuantity);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.prId !== undefined) {
    fields.push('pr_id = ?');
    values.push(data.prId);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE mrp_requirements SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteByMRPRun = async (mrpRunId: number): Promise<boolean> => {
  const result = await execute(
    'DELETE FROM mrp_requirements WHERE mrp_run_id = ?',
    [mrpRunId]
  );
  return result.affectedRows > 0;
};
