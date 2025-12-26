import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { MaintenanceHistory } from '@/lib/types/maintenance';

export interface MaintenanceHistoryRow extends RowDataPacket {
  id: number;
  maintenance_work_order_id: number;
  machine_id: number;
  maintenance_type: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  maintenance_date: Date;
  technician_id?: number;
  duration_hours: number;
  work_performed: string;
  parts_replaced?: string;
  findings?: string;
  recommendations?: string;
  next_action_required: boolean;
  created_at: Date;
  created_by?: number;
}

const mapRowToHistory = (row: MaintenanceHistoryRow): MaintenanceHistory => ({
  id: row.id,
  maintenanceWorkOrderId: row.maintenance_work_order_id,
  machineId: row.machine_id,
  maintenanceType: row.maintenance_type,
  maintenanceDate: row.maintenance_date,
  technicianId: row.technician_id,
  durationHours: row.duration_hours,
  workPerformed: row.work_performed,
  partsReplaced: row.parts_replaced,
  findings: row.findings,
  recommendations: row.recommendations,
  nextActionRequired: row.next_action_required,
  createdAt: row.created_at,
  createdBy: row.created_by,
});

export const findById = async (id: number): Promise<MaintenanceHistory | null> => {
  const row = await queryOne<MaintenanceHistoryRow>(
    'SELECT * FROM maintenance_history WHERE id = ?',
    [id]
  );
  return row ? mapRowToHistory(row) : null;
};

export const findByWorkOrder = async (workOrderId: number): Promise<MaintenanceHistory | null> => {
  const row = await queryOne<MaintenanceHistoryRow>(
    'SELECT * FROM maintenance_history WHERE maintenance_work_order_id = ?',
    [workOrderId]
  );
  return row ? mapRowToHistory(row) : null;
};

export const findByMachine = async (machineId: number): Promise<MaintenanceHistory[]> => {
  const rows = await query<MaintenanceHistoryRow[]>(
    'SELECT * FROM maintenance_history WHERE machine_id = ? ORDER BY maintenance_date DESC',
    [machineId]
  );
  return rows.map(mapRowToHistory);
};

export const findAll = async (filters?: {
  machineId?: number;
  maintenanceType?: string;
  technicianId?: number;
  fromDate?: Date;
  toDate?: Date;
  nextActionRequired?: boolean;
}): Promise<MaintenanceHistory[]> => {
  let sql = 'SELECT * FROM maintenance_history WHERE 1=1';
  const params: any[] = [];

  if (filters?.machineId) {
    sql += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.maintenanceType) {
    sql += ' AND maintenance_type = ?';
    params.push(filters.maintenanceType);
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

  if (filters?.nextActionRequired !== undefined) {
    sql += ' AND next_action_required = ?';
    params.push(filters.nextActionRequired);
  }

  sql += ' ORDER BY maintenance_date DESC';

  const rows = await query<MaintenanceHistoryRow[]>(sql, params);
  return rows.map(mapRowToHistory);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    machineId?: number;
    maintenanceType?: string;
    technicianId?: number;
    fromDate?: Date;
    toDate?: Date;
    nextActionRequired?: boolean;
  }
): Promise<{ data: MaintenanceHistory[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.machineId) {
    whereClause += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.maintenanceType) {
    whereClause += ' AND maintenance_type = ?';
    params.push(filters.maintenanceType);
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

  if (filters?.nextActionRequired !== undefined) {
    whereClause += ' AND next_action_required = ?';
    params.push(filters.nextActionRequired);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM maintenance_history${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<MaintenanceHistoryRow[]>(
    `SELECT * FROM maintenance_history${whereClause} 
     ORDER BY maintenance_date DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToHistory),
    total,
  };
};

export const create = async (data: {
  maintenanceWorkOrderId: number;
  machineId: number;
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  maintenanceDate: Date;
  technicianId?: number;
  durationHours: number;
  workPerformed: string;
  partsReplaced?: string;
  findings?: string;
  recommendations?: string;
  nextActionRequired?: boolean;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO maintenance_history 
     (maintenance_work_order_id, machine_id, maintenance_type, maintenance_date, 
      technician_id, duration_hours, work_performed, parts_replaced, findings, 
      recommendations, next_action_required, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.maintenanceWorkOrderId,
      data.machineId,
      data.maintenanceType,
      data.maintenanceDate,
      data.technicianId,
      data.durationHours,
      data.workPerformed,
      data.partsReplaced,
      data.findings,
      data.recommendations,
      data.nextActionRequired || false,
      data.createdBy,
    ]
  );
  return result.insertId;
};
