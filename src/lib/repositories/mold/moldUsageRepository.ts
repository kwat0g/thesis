import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { MoldUsage } from '@/lib/types/mold';

export interface MoldUsageRow extends RowDataPacket {
  id: number;
  mold_id: number;
  work_order_id: number;
  usage_start: Date;
  usage_end?: Date;
  shots_produced: number;
  status: 'in_use' | 'completed';
  notes?: string;
  created_at: Date;
  created_by?: number;
}

const mapRowToUsage = (row: MoldUsageRow): MoldUsage => ({
  id: row.id,
  moldId: row.mold_id,
  workOrderId: row.work_order_id,
  usageStart: row.usage_start,
  usageEnd: row.usage_end,
  shotsProduced: row.shots_produced,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

export const findById = async (id: number): Promise<MoldUsage | null> => {
  const row = await queryOne<MoldUsageRow>(
    'SELECT * FROM mold_usage WHERE id = ?',
    [id]
  );
  return row ? mapRowToUsage(row) : null;
};

export const findByMold = async (moldId: number): Promise<MoldUsage[]> => {
  const rows = await query<MoldUsageRow[]>(
    'SELECT * FROM mold_usage WHERE mold_id = ? ORDER BY usage_start DESC',
    [moldId]
  );
  return rows.map(mapRowToUsage);
};

export const findByWorkOrder = async (workOrderId: number): Promise<MoldUsage | null> => {
  const row = await queryOne<MoldUsageRow>(
    'SELECT * FROM mold_usage WHERE work_order_id = ?',
    [workOrderId]
  );
  return row ? mapRowToUsage(row) : null;
};

export const findActiveUsage = async (moldId: number): Promise<MoldUsage | null> => {
  const row = await queryOne<MoldUsageRow>(
    'SELECT * FROM mold_usage WHERE mold_id = ? AND status = ? ORDER BY usage_start DESC LIMIT 1',
    [moldId, 'in_use']
  );
  return row ? mapRowToUsage(row) : null;
};

export const findAll = async (filters?: {
  moldId?: number;
  workOrderId?: number;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MoldUsage[]> => {
  let sql = 'SELECT * FROM mold_usage WHERE 1=1';
  const params: any[] = [];

  if (filters?.moldId) {
    sql += ' AND mold_id = ?';
    params.push(filters.moldId);
  }

  if (filters?.workOrderId) {
    sql += ' AND work_order_id = ?';
    params.push(filters.workOrderId);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    sql += ' AND usage_start >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND usage_start <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY usage_start DESC';

  const rows = await query<MoldUsageRow[]>(sql, params);
  return rows.map(mapRowToUsage);
};

export const create = async (data: {
  moldId: number;
  workOrderId: number;
  usageStart: Date;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO mold_usage 
     (mold_id, work_order_id, usage_start, notes, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.moldId,
      data.workOrderId,
      data.usageStart,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    usageEnd?: Date;
    shotsProduced?: number;
    status?: 'in_use' | 'completed';
    notes?: string;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.usageEnd !== undefined) {
    fields.push('usage_end = ?');
    values.push(data.usageEnd);
  }
  if (data.shotsProduced !== undefined) {
    fields.push('shots_produced = ?');
    values.push(data.shotsProduced);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE mold_usage SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const getTotalShotsByMold = async (moldId: number): Promise<number> => {
  const row = await queryOne<RowDataPacket>(
    'SELECT COALESCE(SUM(shots_produced), 0) as total FROM mold_usage WHERE mold_id = ?',
    [moldId]
  );
  return row?.total || 0;
};
