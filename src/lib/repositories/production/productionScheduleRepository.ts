import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { ProductionSchedule } from '@/lib/types/production';

export interface ProductionScheduleRow extends RowDataPacket {
  id: number;
  production_order_id: number;
  scheduled_date: Date;
  scheduled_quantity: number;
  machine_id?: number;
  shift_id?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToSchedule = (row: ProductionScheduleRow): ProductionSchedule => ({
  id: row.id,
  productionOrderId: row.production_order_id,
  scheduledDate: row.scheduled_date,
  scheduledQuantity: row.scheduled_quantity,
  machineId: row.machine_id,
  shiftId: row.shift_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<ProductionSchedule | null> => {
  const row = await queryOne<ProductionScheduleRow>(
    'SELECT * FROM production_schedules WHERE id = ?',
    [id]
  );
  return row ? mapRowToSchedule(row) : null;
};

export const findByProductionOrder = async (productionOrderId: number): Promise<ProductionSchedule[]> => {
  const rows = await query<ProductionScheduleRow[]>(
    'SELECT * FROM production_schedules WHERE production_order_id = ? ORDER BY scheduled_date',
    [productionOrderId]
  );
  return rows.map(mapRowToSchedule);
};

export const findAll = async (filters?: {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  machineId?: number;
}): Promise<ProductionSchedule[]> => {
  let sql = 'SELECT * FROM production_schedules WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    sql += ' AND scheduled_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND scheduled_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.machineId) {
    sql += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  sql += ' ORDER BY scheduled_date, created_at';

  const rows = await query<ProductionScheduleRow[]>(sql, params);
  return rows.map(mapRowToSchedule);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    machineId?: number;
  }
): Promise<{ data: ProductionSchedule[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    whereClause += ' AND scheduled_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND scheduled_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.machineId) {
    whereClause += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM production_schedules${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<ProductionScheduleRow[]>(
    `SELECT * FROM production_schedules${whereClause} 
     ORDER BY scheduled_date, created_at 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToSchedule),
    total,
  };
};

export const create = async (data: {
  productionOrderId: number;
  scheduledDate: Date;
  scheduledQuantity: number;
  machineId?: number;
  shiftId?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO production_schedules 
     (production_order_id, scheduled_date, scheduled_quantity, machine_id, shift_id, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.productionOrderId,
      data.scheduledDate,
      data.scheduledQuantity,
      data.machineId,
      data.shiftId,
      data.status || 'scheduled',
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    scheduledDate?: Date;
    scheduledQuantity?: number;
    machineId?: number;
    shiftId?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.scheduledDate !== undefined) {
    fields.push('scheduled_date = ?');
    values.push(data.scheduledDate);
  }
  if (data.scheduledQuantity !== undefined) {
    fields.push('scheduled_quantity = ?');
    values.push(data.scheduledQuantity);
  }
  if (data.machineId !== undefined) {
    fields.push('machine_id = ?');
    values.push(data.machineId);
  }
  if (data.shiftId !== undefined) {
    fields.push('shift_id = ?');
    values.push(data.shiftId);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE production_schedules SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteSchedule = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM production_schedules WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteByProductionOrder = async (productionOrderId: number): Promise<boolean> => {
  const result = await execute(
    'DELETE FROM production_schedules WHERE production_order_id = ?',
    [productionOrderId]
  );
  return result.affectedRows > 0;
};
