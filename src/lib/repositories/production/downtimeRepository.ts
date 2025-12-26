import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { ProductionDowntime } from '@/lib/types/production';

export interface ProductionDowntimeRow extends RowDataPacket {
  id: number;
  work_order_id: number;
  machine_id?: number;
  downtime_start: Date;
  downtime_end?: Date;
  duration_minutes?: number;
  reason: string;
  category: 'breakdown' | 'changeover' | 'material_shortage' | 'quality_issue' | 'other';
  notes?: string;
  created_at: Date;
  created_by?: number;
}

const mapRowToDowntime = (row: ProductionDowntimeRow): ProductionDowntime => ({
  id: row.id,
  workOrderId: row.work_order_id,
  machineId: row.machine_id,
  downtimeStart: row.downtime_start,
  downtimeEnd: row.downtime_end,
  durationMinutes: row.duration_minutes,
  reason: row.reason,
  category: row.category,
  notes: row.notes,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

export const findById = async (id: number): Promise<ProductionDowntime | null> => {
  const row = await queryOne<ProductionDowntimeRow>(
    'SELECT * FROM production_downtime WHERE id = ?',
    [id]
  );
  return row ? mapRowToDowntime(row) : null;
};

export const findByWorkOrder = async (workOrderId: number): Promise<ProductionDowntime[]> => {
  const rows = await query<ProductionDowntimeRow[]>(
    'SELECT * FROM production_downtime WHERE work_order_id = ? ORDER BY downtime_start DESC',
    [workOrderId]
  );
  return rows.map(mapRowToDowntime);
};

export const findAll = async (filters?: {
  workOrderId?: number;
  machineId?: number;
  category?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<ProductionDowntime[]> => {
  let sql = 'SELECT * FROM production_downtime WHERE 1=1';
  const params: any[] = [];

  if (filters?.workOrderId) {
    sql += ' AND work_order_id = ?';
    params.push(filters.workOrderId);
  }

  if (filters?.machineId) {
    sql += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.fromDate) {
    sql += ' AND downtime_start >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND downtime_start <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY downtime_start DESC';

  const rows = await query<ProductionDowntimeRow[]>(sql, params);
  return rows.map(mapRowToDowntime);
};

export const create = async (data: {
  workOrderId: number;
  machineId?: number;
  downtimeStart: Date;
  downtimeEnd?: Date;
  durationMinutes?: number;
  reason: string;
  category: 'breakdown' | 'changeover' | 'material_shortage' | 'quality_issue' | 'other';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO production_downtime 
     (work_order_id, machine_id, downtime_start, downtime_end, duration_minutes, reason, category, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.workOrderId,
      data.machineId,
      data.downtimeStart,
      data.downtimeEnd,
      data.durationMinutes,
      data.reason,
      data.category,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    downtimeEnd?: Date;
    durationMinutes?: number;
    notes?: string;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.downtimeEnd !== undefined) {
    fields.push('downtime_end = ?');
    values.push(data.downtimeEnd);
  }
  if (data.durationMinutes !== undefined) {
    fields.push('duration_minutes = ?');
    values.push(data.durationMinutes);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE production_downtime SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteDowntime = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM production_downtime WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
