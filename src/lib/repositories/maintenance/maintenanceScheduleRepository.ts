import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { MaintenanceSchedule } from '@/lib/types/maintenance';

export interface MaintenanceScheduleRow extends RowDataPacket {
  id: number;
  schedule_code: string;
  machine_id: number;
  maintenance_type: 'preventive' | 'predictive' | 'routine';
  frequency_days: number;
  last_maintenance_date?: Date;
  next_maintenance_date: Date;
  description?: string;
  estimated_duration_hours: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToSchedule = (row: MaintenanceScheduleRow): MaintenanceSchedule => ({
  id: row.id,
  scheduleCode: row.schedule_code,
  machineId: row.machine_id,
  maintenanceType: row.maintenance_type,
  frequencyDays: row.frequency_days,
  lastMaintenanceDate: row.last_maintenance_date,
  nextMaintenanceDate: row.next_maintenance_date,
  description: row.description,
  estimatedDurationHours: row.estimated_duration_hours,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<MaintenanceSchedule | null> => {
  const row = await queryOne<MaintenanceScheduleRow>(
    'SELECT * FROM maintenance_schedules WHERE id = ?',
    [id]
  );
  return row ? mapRowToSchedule(row) : null;
};

export const findByScheduleCode = async (scheduleCode: string): Promise<MaintenanceSchedule | null> => {
  const row = await queryOne<MaintenanceScheduleRow>(
    'SELECT * FROM maintenance_schedules WHERE schedule_code = ?',
    [scheduleCode]
  );
  return row ? mapRowToSchedule(row) : null;
};

export const findByMachine = async (machineId: number): Promise<MaintenanceSchedule[]> => {
  const rows = await query<MaintenanceScheduleRow[]>(
    'SELECT * FROM maintenance_schedules WHERE machine_id = ? ORDER BY next_maintenance_date ASC',
    [machineId]
  );
  return rows.map(mapRowToSchedule);
};

export const findAll = async (filters?: {
  machineId?: number;
  maintenanceType?: string;
  isActive?: boolean;
  dueSoon?: boolean;
}): Promise<MaintenanceSchedule[]> => {
  let sql = 'SELECT * FROM maintenance_schedules WHERE 1=1';
  const params: any[] = [];

  if (filters?.machineId) {
    sql += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.maintenanceType) {
    sql += ' AND maintenance_type = ?';
    params.push(filters.maintenanceType);
  }

  if (filters?.isActive !== undefined) {
    sql += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  if (filters?.dueSoon) {
    sql += ' AND next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
  }

  sql += ' ORDER BY next_maintenance_date ASC';

  const rows = await query<MaintenanceScheduleRow[]>(sql, params);
  return rows.map(mapRowToSchedule);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    machineId?: number;
    maintenanceType?: string;
    isActive?: boolean;
    dueSoon?: boolean;
  }
): Promise<{ data: MaintenanceSchedule[]; total: number }> => {
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

  if (filters?.isActive !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  if (filters?.dueSoon) {
    whereClause += ' AND next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM maintenance_schedules${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<MaintenanceScheduleRow[]>(
    `SELECT * FROM maintenance_schedules${whereClause} 
     ORDER BY next_maintenance_date ASC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToSchedule),
    total,
  };
};

export const create = async (data: {
  scheduleCode: string;
  machineId: number;
  maintenanceType: 'preventive' | 'predictive' | 'routine';
  frequencyDays: number;
  nextMaintenanceDate: Date;
  description?: string;
  estimatedDurationHours?: number;
  isActive?: boolean;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO maintenance_schedules 
     (schedule_code, machine_id, maintenance_type, frequency_days, next_maintenance_date, 
      description, estimated_duration_hours, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.scheduleCode,
      data.machineId,
      data.maintenanceType,
      data.frequencyDays,
      data.nextMaintenanceDate,
      data.description,
      data.estimatedDurationHours || 0,
      data.isActive !== undefined ? data.isActive : true,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    frequencyDays?: number;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    description?: string;
    estimatedDurationHours?: number;
    isActive?: boolean;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.frequencyDays !== undefined) {
    fields.push('frequency_days = ?');
    values.push(data.frequencyDays);
  }
  if (data.lastMaintenanceDate !== undefined) {
    fields.push('last_maintenance_date = ?');
    values.push(data.lastMaintenanceDate);
  }
  if (data.nextMaintenanceDate !== undefined) {
    fields.push('next_maintenance_date = ?');
    values.push(data.nextMaintenanceDate);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.estimatedDurationHours !== undefined) {
    fields.push('estimated_duration_hours = ?');
    values.push(data.estimatedDurationHours);
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
    `UPDATE maintenance_schedules SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteSchedule = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM maintenance_schedules WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const findOverdueSchedules = async (): Promise<MaintenanceSchedule[]> => {
  const rows = await query<MaintenanceScheduleRow[]>(
    `SELECT * FROM maintenance_schedules 
     WHERE is_active = TRUE AND next_maintenance_date < CURDATE()
     ORDER BY next_maintenance_date ASC`
  );
  return rows.map(mapRowToSchedule);
};
