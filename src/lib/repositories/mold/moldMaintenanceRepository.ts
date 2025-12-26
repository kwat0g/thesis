import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { MoldMaintenanceRecord } from '@/lib/types/mold';

export interface MoldMaintenanceRecordRow extends RowDataPacket {
  id: number;
  mold_id: number;
  maintenance_work_order_id?: number;
  maintenance_type: 'preventive' | 'corrective' | 'inspection' | 'cleaning';
  maintenance_date: Date;
  technician_id?: number;
  duration_hours: number;
  work_performed: string;
  parts_replaced?: string;
  findings?: string;
  recommendations?: string;
  shots_before_maintenance: number;
  next_maintenance_shots?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToRecord = (row: MoldMaintenanceRecordRow): MoldMaintenanceRecord => ({
  id: row.id,
  moldId: row.mold_id,
  maintenanceWorkOrderId: row.maintenance_work_order_id,
  maintenanceType: row.maintenance_type,
  maintenanceDate: row.maintenance_date,
  technicianId: row.technician_id,
  durationHours: row.duration_hours,
  workPerformed: row.work_performed,
  partsReplaced: row.parts_replaced,
  findings: row.findings,
  recommendations: row.recommendations,
  shotsBeforeMaintenance: row.shots_before_maintenance,
  nextMaintenanceShots: row.next_maintenance_shots,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<MoldMaintenanceRecord | null> => {
  const row = await queryOne<MoldMaintenanceRecordRow>(
    'SELECT * FROM mold_maintenance_records WHERE id = ?',
    [id]
  );
  return row ? mapRowToRecord(row) : null;
};

export const findByMold = async (moldId: number): Promise<MoldMaintenanceRecord[]> => {
  const rows = await query<MoldMaintenanceRecordRow[]>(
    'SELECT * FROM mold_maintenance_records WHERE mold_id = ? ORDER BY maintenance_date DESC',
    [moldId]
  );
  return rows.map(mapRowToRecord);
};

export const findByMaintenanceWorkOrder = async (mwoId: number): Promise<MoldMaintenanceRecord | null> => {
  const row = await queryOne<MoldMaintenanceRecordRow>(
    'SELECT * FROM mold_maintenance_records WHERE maintenance_work_order_id = ?',
    [mwoId]
  );
  return row ? mapRowToRecord(row) : null;
};

export const findAll = async (filters?: {
  moldId?: number;
  maintenanceType?: string;
  status?: string;
  technicianId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MoldMaintenanceRecord[]> => {
  let sql = 'SELECT * FROM mold_maintenance_records WHERE 1=1';
  const params: any[] = [];

  if (filters?.moldId) {
    sql += ' AND mold_id = ?';
    params.push(filters.moldId);
  }

  if (filters?.maintenanceType) {
    sql += ' AND maintenance_type = ?';
    params.push(filters.maintenanceType);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.technicianId) {
    sql += ' AND technician_id = ?';
    params.push(filters.technicianId);
  }

  if (filters?.fromDate) {
    sql += ' AND maintenance_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND maintenance_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY maintenance_date DESC';

  const rows = await query<MoldMaintenanceRecordRow[]>(sql, params);
  return rows.map(mapRowToRecord);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    moldId?: number;
    maintenanceType?: string;
    status?: string;
    technicianId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: MoldMaintenanceRecord[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.moldId) {
    whereClause += ' AND mold_id = ?';
    params.push(filters.moldId);
  }

  if (filters?.maintenanceType) {
    whereClause += ' AND maintenance_type = ?';
    params.push(filters.maintenanceType);
  }

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.technicianId) {
    whereClause += ' AND technician_id = ?';
    params.push(filters.technicianId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND maintenance_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND maintenance_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM mold_maintenance_records${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<MoldMaintenanceRecordRow[]>(
    `SELECT * FROM mold_maintenance_records${whereClause} 
     ORDER BY maintenance_date DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToRecord),
    total,
  };
};

export const create = async (data: {
  moldId: number;
  maintenanceWorkOrderId?: number;
  maintenanceType: 'preventive' | 'corrective' | 'inspection' | 'cleaning';
  maintenanceDate: Date;
  technicianId?: number;
  durationHours?: number;
  workPerformed: string;
  partsReplaced?: string;
  findings?: string;
  recommendations?: string;
  shotsBeforeMaintenance: number;
  nextMaintenanceShots?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO mold_maintenance_records 
     (mold_id, maintenance_work_order_id, maintenance_type, maintenance_date, technician_id, 
      duration_hours, work_performed, parts_replaced, findings, recommendations, 
      shots_before_maintenance, next_maintenance_shots, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.moldId,
      data.maintenanceWorkOrderId,
      data.maintenanceType,
      data.maintenanceDate,
      data.technicianId,
      data.durationHours || 0,
      data.workPerformed,
      data.partsReplaced,
      data.findings,
      data.recommendations,
      data.shotsBeforeMaintenance,
      data.nextMaintenanceShots,
      data.status || 'scheduled',
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    maintenanceDate?: Date;
    technicianId?: number;
    durationHours?: number;
    workPerformed?: string;
    partsReplaced?: string;
    findings?: string;
    recommendations?: string;
    nextMaintenanceShots?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.maintenanceDate !== undefined) {
    fields.push('maintenance_date = ?');
    values.push(data.maintenanceDate);
  }
  if (data.technicianId !== undefined) {
    fields.push('technician_id = ?');
    values.push(data.technicianId);
  }
  if (data.durationHours !== undefined) {
    fields.push('duration_hours = ?');
    values.push(data.durationHours);
  }
  if (data.workPerformed !== undefined) {
    fields.push('work_performed = ?');
    values.push(data.workPerformed);
  }
  if (data.partsReplaced !== undefined) {
    fields.push('parts_replaced = ?');
    values.push(data.partsReplaced);
  }
  if (data.findings !== undefined) {
    fields.push('findings = ?');
    values.push(data.findings);
  }
  if (data.recommendations !== undefined) {
    fields.push('recommendations = ?');
    values.push(data.recommendations);
  }
  if (data.nextMaintenanceShots !== undefined) {
    fields.push('next_maintenance_shots = ?');
    values.push(data.nextMaintenanceShots);
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
    `UPDATE mold_maintenance_records SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};
