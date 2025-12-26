import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { MaintenanceWorkOrder } from '@/lib/types/maintenance';

export interface MaintenanceWorkOrderRow extends RowDataPacket {
  id: number;
  mwo_number: string;
  machine_id: number;
  maintenance_schedule_id?: number;
  production_downtime_id?: number;
  maintenance_type: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requested_date: Date;
  scheduled_date?: Date;
  started_date?: Date;
  completed_date?: Date;
  assigned_technician_id?: number;
  problem_description: string;
  work_performed?: string;
  root_cause?: string;
  corrective_action?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: Date;
  estimated_duration_hours: number;
  actual_duration_hours: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToWorkOrder = (row: MaintenanceWorkOrderRow): MaintenanceWorkOrder => ({
  id: row.id,
  mwoNumber: row.mwo_number,
  machineId: row.machine_id,
  maintenanceScheduleId: row.maintenance_schedule_id,
  productionDowntimeId: row.production_downtime_id,
  maintenanceType: row.maintenance_type,
  priority: row.priority,
  requestedDate: row.requested_date,
  scheduledDate: row.scheduled_date,
  startedDate: row.started_date,
  completedDate: row.completed_date,
  assignedTechnicianId: row.assigned_technician_id,
  problemDescription: row.problem_description,
  workPerformed: row.work_performed,
  rootCause: row.root_cause,
  correctiveAction: row.corrective_action,
  status: row.status,
  approvalStatus: row.approval_status,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  estimatedDurationHours: row.estimated_duration_hours,
  actualDurationHours: row.actual_duration_hours,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<MaintenanceWorkOrder | null> => {
  const row = await queryOne<MaintenanceWorkOrderRow>(
    'SELECT * FROM maintenance_work_orders WHERE id = ?',
    [id]
  );
  return row ? mapRowToWorkOrder(row) : null;
};

export const findByMWONumber = async (mwoNumber: string): Promise<MaintenanceWorkOrder | null> => {
  const row = await queryOne<MaintenanceWorkOrderRow>(
    'SELECT * FROM maintenance_work_orders WHERE mwo_number = ?',
    [mwoNumber]
  );
  return row ? mapRowToWorkOrder(row) : null;
};

export const findByMachine = async (machineId: number): Promise<MaintenanceWorkOrder[]> => {
  const rows = await query<MaintenanceWorkOrderRow[]>(
    'SELECT * FROM maintenance_work_orders WHERE machine_id = ? ORDER BY requested_date DESC',
    [machineId]
  );
  return rows.map(mapRowToWorkOrder);
};

export const findByDowntime = async (downtimeId: number): Promise<MaintenanceWorkOrder | null> => {
  const row = await queryOne<MaintenanceWorkOrderRow>(
    'SELECT * FROM maintenance_work_orders WHERE production_downtime_id = ?',
    [downtimeId]
  );
  return row ? mapRowToWorkOrder(row) : null;
};

export const findAll = async (filters?: {
  machineId?: number;
  maintenanceType?: string;
  status?: string;
  approvalStatus?: string;
  priority?: string;
  technicianId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MaintenanceWorkOrder[]> => {
  let sql = 'SELECT * FROM maintenance_work_orders WHERE 1=1';
  const params: any[] = [];

  if (filters?.machineId) {
    sql += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.maintenanceType) {
    sql += ' AND maintenance_type = ?';
    params.push(filters.maintenanceType);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.approvalStatus) {
    sql += ' AND approval_status = ?';
    params.push(filters.approvalStatus);
  }

  if (filters?.priority) {
    sql += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters?.technicianId) {
    sql += ' AND assigned_technician_id = ?';
    params.push(filters.technicianId);
  }

  if (filters?.fromDate) {
    sql += ' AND requested_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND requested_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY requested_date DESC';

  const rows = await query<MaintenanceWorkOrderRow[]>(sql, params);
  return rows.map(mapRowToWorkOrder);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    machineId?: number;
    maintenanceType?: string;
    status?: string;
    approvalStatus?: string;
    priority?: string;
    technicianId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: MaintenanceWorkOrder[]; total: number }> => {
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

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.approvalStatus) {
    whereClause += ' AND approval_status = ?';
    params.push(filters.approvalStatus);
  }

  if (filters?.priority) {
    whereClause += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters?.technicianId) {
    whereClause += ' AND assigned_technician_id = ?';
    params.push(filters.technicianId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND requested_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND requested_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM maintenance_work_orders${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<MaintenanceWorkOrderRow[]>(
    `SELECT * FROM maintenance_work_orders${whereClause} 
     ORDER BY requested_date DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToWorkOrder),
    total,
  };
};

export const create = async (data: {
  mwoNumber: string;
  machineId: number;
  maintenanceScheduleId?: number;
  productionDowntimeId?: number;
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requestedDate: Date;
  problemDescription: string;
  estimatedDurationHours?: number;
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO maintenance_work_orders 
     (mwo_number, machine_id, maintenance_schedule_id, production_downtime_id, 
      maintenance_type, priority, requested_date, problem_description, 
      estimated_duration_hours, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.mwoNumber,
      data.machineId,
      data.maintenanceScheduleId,
      data.productionDowntimeId,
      data.maintenanceType,
      data.priority || 'normal',
      data.requestedDate,
      data.problemDescription,
      data.estimatedDurationHours || 0,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    scheduledDate?: Date;
    startedDate?: Date;
    completedDate?: Date;
    assignedTechnicianId?: number;
    workPerformed?: string;
    rootCause?: string;
    correctiveAction?: string;
    status?: 'pending' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvedBy?: number;
    approvedAt?: Date;
    actualDurationHours?: number;
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.scheduledDate !== undefined) {
    fields.push('scheduled_date = ?');
    values.push(data.scheduledDate);
  }
  if (data.startedDate !== undefined) {
    fields.push('started_date = ?');
    values.push(data.startedDate);
  }
  if (data.completedDate !== undefined) {
    fields.push('completed_date = ?');
    values.push(data.completedDate);
  }
  if (data.assignedTechnicianId !== undefined) {
    fields.push('assigned_technician_id = ?');
    values.push(data.assignedTechnicianId);
  }
  if (data.workPerformed !== undefined) {
    fields.push('work_performed = ?');
    values.push(data.workPerformed);
  }
  if (data.rootCause !== undefined) {
    fields.push('root_cause = ?');
    values.push(data.rootCause);
  }
  if (data.correctiveAction !== undefined) {
    fields.push('corrective_action = ?');
    values.push(data.correctiveAction);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.approvalStatus !== undefined) {
    fields.push('approval_status = ?');
    values.push(data.approvalStatus);
  }
  if (data.approvedBy !== undefined) {
    fields.push('approved_by = ?');
    values.push(data.approvedBy);
  }
  if (data.approvedAt !== undefined) {
    fields.push('approved_at = ?');
    values.push(data.approvedAt);
  }
  if (data.actualDurationHours !== undefined) {
    fields.push('actual_duration_hours = ?');
    values.push(data.actualDurationHours);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE maintenance_work_orders SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteWorkOrder = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM maintenance_work_orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
