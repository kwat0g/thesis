import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { MoldConditionHistory } from '@/lib/types/mold';

export interface MoldConditionHistoryRow extends RowDataPacket {
  id: number;
  mold_id: number;
  previous_status?: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  new_status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  change_date: Date;
  reason?: string;
  total_shots_at_change: number;
  condition_notes?: string;
  changed_by?: number;
  created_at: Date;
}

const mapRowToHistory = (row: MoldConditionHistoryRow): MoldConditionHistory => ({
  id: row.id,
  moldId: row.mold_id,
  previousStatus: row.previous_status,
  newStatus: row.new_status,
  changeDate: row.change_date,
  reason: row.reason,
  totalShotsAtChange: row.total_shots_at_change,
  conditionNotes: row.condition_notes,
  changedBy: row.changed_by,
  createdAt: row.created_at,
});

export const findById = async (id: number): Promise<MoldConditionHistory | null> => {
  const row = await queryOne<MoldConditionHistoryRow>(
    'SELECT * FROM mold_condition_history WHERE id = ?',
    [id]
  );
  return row ? mapRowToHistory(row) : null;
};

export const findByMold = async (moldId: number): Promise<MoldConditionHistory[]> => {
  const rows = await query<MoldConditionHistoryRow[]>(
    'SELECT * FROM mold_condition_history WHERE mold_id = ? ORDER BY change_date DESC',
    [moldId]
  );
  return rows.map(mapRowToHistory);
};

export const findLatestByMold = async (moldId: number): Promise<MoldConditionHistory | null> => {
  const row = await queryOne<MoldConditionHistoryRow>(
    'SELECT * FROM mold_condition_history WHERE mold_id = ? ORDER BY change_date DESC LIMIT 1',
    [moldId]
  );
  return row ? mapRowToHistory(row) : null;
};

export const findAll = async (filters?: {
  moldId?: number;
  newStatus?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MoldConditionHistory[]> => {
  let sql = 'SELECT * FROM mold_condition_history WHERE 1=1';
  const params: any[] = [];

  if (filters?.moldId) {
    sql += ' AND mold_id = ?';
    params.push(filters.moldId);
  }

  if (filters?.newStatus) {
    sql += ' AND new_status = ?';
    params.push(filters.newStatus);
  }

  if (filters?.fromDate) {
    sql += ' AND change_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND change_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY change_date DESC';

  const rows = await query<MoldConditionHistoryRow[]>(sql, params);
  return rows.map(mapRowToHistory);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    moldId?: number;
    newStatus?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: MoldConditionHistory[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.moldId) {
    whereClause += ' AND mold_id = ?';
    params.push(filters.moldId);
  }

  if (filters?.newStatus) {
    whereClause += ' AND new_status = ?';
    params.push(filters.newStatus);
  }

  if (filters?.fromDate) {
    whereClause += ' AND change_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND change_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM mold_condition_history${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<MoldConditionHistoryRow[]>(
    `SELECT * FROM mold_condition_history${whereClause} 
     ORDER BY change_date DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToHistory),
    total,
  };
};

export const create = async (data: {
  moldId: number;
  previousStatus?: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  newStatus: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  changeDate: Date;
  reason?: string;
  totalShotsAtChange: number;
  conditionNotes?: string;
  changedBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO mold_condition_history 
     (mold_id, previous_status, new_status, change_date, reason, total_shots_at_change, condition_notes, changed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.moldId,
      data.previousStatus,
      data.newStatus,
      data.changeDate,
      data.reason,
      data.totalShotsAtChange,
      data.conditionNotes,
      data.changedBy,
    ]
  );
  return result.insertId;
};
