import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';

export interface MRPRun {
  id: number;
  runNumber: string;
  runDate: Date;
  planningHorizonDays: number;
  status: 'running' | 'completed' | 'failed';
  totalRequirements: number;
  totalShortages: number;
  notes?: string;
  createdAt: Date;
  createdBy?: number;
}

export interface MRPRunRow extends RowDataPacket {
  id: number;
  run_number: string;
  run_date: Date;
  planning_horizon_days: number;
  status: 'running' | 'completed' | 'failed';
  total_requirements: number;
  total_shortages: number;
  notes?: string;
  created_at: Date;
  created_by?: number;
}

const mapRowToMRPRun = (row: MRPRunRow): MRPRun => ({
  id: row.id,
  runNumber: row.run_number,
  runDate: row.run_date,
  planningHorizonDays: row.planning_horizon_days,
  status: row.status,
  totalRequirements: row.total_requirements,
  totalShortages: row.total_shortages,
  notes: row.notes,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

export const findById = async (id: number): Promise<MRPRun | null> => {
  const row = await queryOne<MRPRunRow>(
    'SELECT * FROM mrp_runs WHERE id = ?',
    [id]
  );
  return row ? mapRowToMRPRun(row) : null;
};

export const findByRunNumber = async (runNumber: string): Promise<MRPRun | null> => {
  const row = await queryOne<MRPRunRow>(
    'SELECT * FROM mrp_runs WHERE run_number = ?',
    [runNumber]
  );
  return row ? mapRowToMRPRun(row) : null;
};

export const findAll = async (filters?: {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MRPRun[]> => {
  let sql = 'SELECT * FROM mrp_runs WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    sql += ' AND run_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND run_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY run_date DESC, created_at DESC';

  const rows = await query<MRPRunRow[]>(sql, params);
  return rows.map(mapRowToMRPRun);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: MRPRun[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    whereClause += ' AND run_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND run_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM mrp_runs${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<MRPRunRow[]>(
    `SELECT * FROM mrp_runs${whereClause} 
     ORDER BY run_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToMRPRun),
    total,
  };
};

export const create = async (data: {
  runNumber: string;
  runDate: Date;
  planningHorizonDays?: number;
  status?: 'running' | 'completed' | 'failed';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO mrp_runs 
     (run_number, run_date, planning_horizon_days, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.runNumber,
      data.runDate,
      data.planningHorizonDays || 30,
      data.status || 'running',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    status?: 'running' | 'completed' | 'failed';
    totalRequirements?: number;
    totalShortages?: number;
    notes?: string;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.totalRequirements !== undefined) {
    fields.push('total_requirements = ?');
    values.push(data.totalRequirements);
  }
  if (data.totalShortages !== undefined) {
    fields.push('total_shortages = ?');
    values.push(data.totalShortages);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE mrp_runs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};
