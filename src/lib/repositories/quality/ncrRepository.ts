import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { QCNCR } from '@/lib/types/quality';

export interface NCRRow extends RowDataPacket {
  id: number;
  ncr_number: string;
  inspection_id: number;
  ncr_date: Date;
  item_id: number;
  quantity_affected: number;
  defect_description: string;
  root_cause?: string;
  corrective_action?: string;
  disposition: 'pending' | 'rework' | 'scrap' | 'use_as_is' | 'return_to_supplier';
  status: 'open' | 'in_progress' | 'closed';
  closed_date?: Date;
  closed_by?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToNCR = (row: NCRRow): QCNCR => ({
  id: row.id,
  ncrNumber: row.ncr_number,
  inspectionId: row.inspection_id,
  itemId: row.item_id,
  quantityAffected: row.quantity_affected,
  defectDescription: row.defect_description,
  rootCause: row.root_cause,
  correctiveAction: row.corrective_action,
  preventiveAction: row.preventive_action,
  disposition: row.disposition,
  status: row.status,
  raisedBy: row.raised_by,
  raisedDate: row.ncr_date,
  closedBy: row.closed_by,
  closedDate: row.closed_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<QCNCR | null> => {
  const row = await queryOne<NCRRow>(
    'SELECT * FROM QCNCR WHERE id = ?',
    [id]
  );
  return row ? mapRowToNCR(row) : null;
};

export const findByNCRNumber = async (ncrNumber: string): Promise<QCNCR | null> => {
  const row = await queryOne<NCRRow>(
    'SELECT * FROM QCNCR WHERE ncr_number = ?',
    [ncrNumber]
  );
  return row ? mapRowToNCR(row) : null;
};

export const findByInspection = async (inspectionId: number): Promise<QCNCR[]> => {
  const rows = await query<NCRRow[]>(
    'SELECT * FROM QCNCR WHERE inspection_id = ? ORDER BY ncr_date DESC',
    [inspectionId]
  );
  return rows.map(mapRowToNCR);
};

export const findAll = async (filters?: {
  disposition?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<QCNCR[]> => {
  let sql = 'SELECT * FROM QCNCR WHERE 1=1';
  const params: any[] = [];

  if (filters?.disposition) {
    sql += ' AND disposition = ?';
    params.push(filters.disposition);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    sql += ' AND ncr_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND ncr_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY ncr_date DESC, created_at DESC';

  const rows = await query<NCRRow[]>(sql, params);
  return rows.map(mapRowToNCR);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    disposition?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: QCNCR[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.disposition) {
    whereClause += ' AND disposition = ?';
    params.push(filters.disposition);
  }

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    whereClause += ' AND ncr_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND ncr_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM QCNCR${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<NCRRow[]>(
    `SELECT * FROM QCNCR${whereClause} 
     ORDER BY ncr_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToNCR),
    total,
  };
};

export const create = async (data: {
  ncrNumber: string;
  inspectionId: number;
  ncrDate: Date;
  itemId: number;
  quantityAffected: number;
  defectDescription: string;
  rootCause?: string;
  correctiveAction?: string;
  disposition?: 'pending' | 'rework' | 'scrap' | 'use_as_is' | 'return_to_supplier';
  status?: 'open' | 'in_progress' | 'closed';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO QCNCR 
     (ncr_number, inspection_id, ncr_date, item_id, quantity_affected, defect_description, 
      root_cause, corrective_action, disposition, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ncrNumber,
      data.inspectionId,
      data.ncrDate,
      data.itemId,
      data.quantityAffected,
      data.defectDescription,
      data.rootCause,
      data.correctiveAction,
      data.disposition || 'pending',
      data.status || 'open',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    rootCause?: string;
    correctiveAction?: string;
    disposition?: 'pending' | 'rework' | 'scrap' | 'use_as_is' | 'return_to_supplier';
    status?: 'open' | 'in_progress' | 'closed';
    closedDate?: Date;
    closedBy?: number;
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.rootCause !== undefined) {
    fields.push('root_cause = ?');
    values.push(data.rootCause);
  }
  if (data.correctiveAction !== undefined) {
    fields.push('corrective_action = ?');
    values.push(data.correctiveAction);
  }
  if (data.disposition !== undefined) {
    fields.push('disposition = ?');
    values.push(data.disposition);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.closedDate !== undefined) {
    fields.push('closed_date = ?');
    values.push(data.closedDate);
  }
  if (data.closedBy !== undefined) {
    fields.push('closed_by = ?');
    values.push(data.closedBy);
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
    `UPDATE QCNCR SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteNCR = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM QCNCR WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
