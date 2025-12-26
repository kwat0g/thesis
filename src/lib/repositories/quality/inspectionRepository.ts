import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { QCInspection } from '@/lib/types/quality';

export interface QCInspectionRow extends RowDataPacket {
  id: number;
  inspection_number: string;
  inspection_type: 'incoming' | 'in_process' | 'final';
  inspection_date: Date;
  inspector_id: number;
  reference_type: 'goods_receipt' | 'production_order';
  reference_id: number;
  item_id: number;
  quantity_inspected: number;
  quantity_passed: number;
  quantity_failed: number;
  status: 'pending' | 'in_progress' | 'completed';
  result: 'pass' | 'fail' | 'conditional_pass';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToInspection = (row: QCInspectionRow): QCInspection => ({
  id: row.id,
  inspectionNumber: row.inspection_number,
  inspectionType: row.inspection_type,
  inspectionDate: row.inspection_date,
  inspectorId: row.inspector_id,
  referenceType: row.reference_type,
  referenceId: row.reference_id,
  itemId: row.item_id,
  quantityInspected: row.quantity_inspected,
  quantityAccepted: row.quantity_passed,
  quantityRejected: row.quantity_failed,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<QCInspection | null> => {
  const row = await queryOne<QCInspectionRow>(
    'SELECT * FROM inspection_records WHERE id = ?',
    [id]
  );
  return row ? mapRowToInspection(row) : null;
};

export const findByInspectionNumber = async (inspectionNumber: string): Promise<QCInspection | null> => {
  const row = await queryOne<QCInspectionRow>(
    'SELECT * FROM inspection_records WHERE inspection_number = ?',
    [inspectionNumber]
  );
  return row ? mapRowToInspection(row) : null;
};

export const findByReference = async (
  referenceType: 'goods_receipt' | 'production_order',
  referenceId: number
): Promise<QCInspection[]> => {
  const rows = await query<QCInspectionRow[]>(
    'SELECT * FROM inspection_records WHERE reference_type = ? AND reference_id = ? ORDER BY inspection_date DESC',
    [referenceType, referenceId]
  );
  return rows.map(mapRowToInspection);
};

export const findAll = async (filters?: {
  inspectionType?: string;
  status?: string;
  result?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<QCInspection[]> => {
  let sql = 'SELECT * FROM inspection_records WHERE 1=1';
  const params: any[] = [];

  if (filters?.inspectionType) {
    sql += ' AND inspection_type = ?';
    params.push(filters.inspectionType);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.result) {
    sql += ' AND result = ?';
    params.push(filters.result);
  }

  if (filters?.fromDate) {
    sql += ' AND inspection_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND inspection_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY inspection_date DESC, created_at DESC';

  const rows = await query<QCInspectionRow[]>(sql, params);
  return rows.map(mapRowToInspection);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    inspectionType?: string;
    status?: string;
    result?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: QCInspection[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.inspectionType) {
    whereClause += ' AND inspection_type = ?';
    params.push(filters.inspectionType);
  }

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.result) {
    whereClause += ' AND result = ?';
    params.push(filters.result);
  }

  if (filters?.fromDate) {
    whereClause += ' AND inspection_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND inspection_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM inspection_records${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<QCInspectionRow[]>(
    `SELECT * FROM inspection_records${whereClause} 
     ORDER BY inspection_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToInspection),
    total,
  };
};

export const create = async (data: {
  inspectionNumber: string;
  inspectionType: 'incoming' | 'in_process' | 'final';
  inspectionDate: Date;
  inspectorId: number;
  referenceType: 'goods_receipt' | 'production_order';
  referenceId: number;
  itemId: number;
  quantityInspected: number;
  quantityPassed: number;
  quantityFailed: number;
  status?: 'pending' | 'in_progress' | 'completed';
  result?: 'pass' | 'fail' | 'conditional_pass';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO inspection_records 
     (inspection_number, inspection_type, inspection_date, inspector_id, reference_type, reference_id, 
      item_id, quantity_inspected, quantity_passed, quantity_failed, status, result, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.inspectionNumber,
      data.inspectionType,
      data.inspectionDate,
      data.inspectorId,
      data.referenceType,
      data.referenceId,
      data.itemId,
      data.quantityInspected,
      data.quantityPassed,
      data.quantityFailed,
      data.status || 'pending',
      data.result,
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    quantityPassed?: number;
    quantityFailed?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    result?: 'pass' | 'fail' | 'conditional_pass';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.quantityPassed !== undefined) {
    fields.push('quantity_passed = ?');
    values.push(data.quantityPassed);
  }
  if (data.quantityFailed !== undefined) {
    fields.push('quantity_failed = ?');
    values.push(data.quantityFailed);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.result !== undefined) {
    fields.push('result = ?');
    values.push(data.result);
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
    `UPDATE inspection_records SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteInspection = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM inspection_records WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
