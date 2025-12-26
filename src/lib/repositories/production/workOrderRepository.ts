import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { WorkOrder } from '@/lib/types/production';

export interface WorkOrderRow extends RowDataPacket {
  id: number;
  wo_number: string;
  production_order_id: number;
  production_schedule_id?: number;
  item_id: number;
  quantity_planned: number;
  quantity_produced: number;
  quantity_scrap: number;
  quantity_rework: number;
  machine_id?: number;
  mold_id?: number;
  supervisor_id?: number;
  start_date?: Date;
  end_date?: Date;
  status: 'pending' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToWorkOrder = (row: WorkOrderRow): WorkOrder => ({
  id: row.id,
  woNumber: row.wo_number,
  productionOrderId: row.production_order_id,
  productionScheduleId: row.production_schedule_id,
  itemId: row.item_id,
  quantityPlanned: row.quantity_planned,
  quantityProduced: row.quantity_produced,
  quantityScrap: row.quantity_scrap,
  quantityRework: row.quantity_rework,
  machineId: row.machine_id,
  moldId: row.mold_id,
  supervisorId: row.supervisor_id,
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<WorkOrder | null> => {
  const row = await queryOne<WorkOrderRow>(
    'SELECT * FROM work_orders WHERE id = ?',
    [id]
  );
  return row ? mapRowToWorkOrder(row) : null;
};

export const findByWONumber = async (woNumber: string): Promise<WorkOrder | null> => {
  const row = await queryOne<WorkOrderRow>(
    'SELECT * FROM work_orders WHERE wo_number = ?',
    [woNumber]
  );
  return row ? mapRowToWorkOrder(row) : null;
};

export const findByProductionOrder = async (productionOrderId: number): Promise<WorkOrder[]> => {
  const rows = await query<WorkOrderRow[]>(
    'SELECT * FROM work_orders WHERE production_order_id = ? ORDER BY created_at DESC',
    [productionOrderId]
  );
  return rows.map(mapRowToWorkOrder);
};

export const findAll = async (filters?: {
  status?: string;
  machineId?: number;
  supervisorId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<WorkOrder[]> => {
  let sql = 'SELECT * FROM work_orders WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.machineId) {
    sql += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.supervisorId) {
    sql += ' AND supervisor_id = ?';
    params.push(filters.supervisorId);
  }

  if (filters?.fromDate) {
    sql += ' AND start_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND start_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY start_date DESC, created_at DESC';

  const rows = await query<WorkOrderRow[]>(sql, params);
  return rows.map(mapRowToWorkOrder);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    machineId?: number;
    supervisorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: WorkOrder[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.machineId) {
    whereClause += ' AND machine_id = ?';
    params.push(filters.machineId);
  }

  if (filters?.supervisorId) {
    whereClause += ' AND supervisor_id = ?';
    params.push(filters.supervisorId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND start_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND start_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM work_orders${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<WorkOrderRow[]>(
    `SELECT * FROM work_orders${whereClause} 
     ORDER BY start_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToWorkOrder),
    total,
  };
};

export const create = async (data: {
  woNumber: string;
  productionOrderId: number;
  productionScheduleId?: number;
  itemId: number;
  quantityPlanned: number;
  machineId?: number;
  moldId?: number;
  supervisorId?: number;
  status?: 'pending' | 'released';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO work_orders 
     (wo_number, production_order_id, production_schedule_id, item_id, quantity_planned, 
      machine_id, mold_id, supervisor_id, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.woNumber,
      data.productionOrderId,
      data.productionScheduleId,
      data.itemId,
      data.quantityPlanned,
      data.machineId,
      data.moldId,
      data.supervisorId,
      data.status || 'pending',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    quantityProduced?: number;
    quantityScrap?: number;
    quantityRework?: number;
    machineId?: number;
    moldId?: number;
    supervisorId?: number;
    startDate?: Date;
    endDate?: Date;
    status?: 'pending' | 'released' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.quantityProduced !== undefined) {
    fields.push('quantity_produced = ?');
    values.push(data.quantityProduced);
  }
  if (data.quantityScrap !== undefined) {
    fields.push('quantity_scrap = ?');
    values.push(data.quantityScrap);
  }
  if (data.quantityRework !== undefined) {
    fields.push('quantity_rework = ?');
    values.push(data.quantityRework);
  }
  if (data.machineId !== undefined) {
    fields.push('machine_id = ?');
    values.push(data.machineId);
  }
  if (data.moldId !== undefined) {
    fields.push('mold_id = ?');
    values.push(data.moldId);
  }
  if (data.supervisorId !== undefined) {
    fields.push('supervisor_id = ?');
    values.push(data.supervisorId);
  }
  if (data.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(data.endDate);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
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
    `UPDATE work_orders SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteWorkOrder = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM work_orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
