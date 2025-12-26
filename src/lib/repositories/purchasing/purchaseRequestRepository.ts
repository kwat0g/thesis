import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { PurchaseRequest, PurchaseRequestLine } from '@/lib/types/purchasing';

export interface PurchaseRequestRow extends RowDataPacket {
  id: number;
  pr_number: string;
  request_date: Date;
  required_date: Date;
  requestor_id: number;
  justification?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po' | 'cancelled';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
  po_id?: number;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface PurchaseRequestLineRow extends RowDataPacket {
  id: number;
  pr_id: number;
  line_number: number;
  item_id: number;
  quantity: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const mapRowToPR = (row: PurchaseRequestRow): PurchaseRequest => ({
  id: row.id,
  prNumber: row.pr_number,
  requestDate: row.request_date,
  requiredDate: row.required_date,
  requestorId: row.requestor_id,
  justification: row.justification,
  status: row.status,
  approvalStatus: row.approval_status,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  rejectionReason: row.rejection_reason,
  poId: row.po_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

const mapRowToPRLine = (row: PurchaseRequestLineRow): PurchaseRequestLine => ({
  id: row.id,
  prId: row.pr_id,
  lineNumber: row.line_number,
  itemId: row.item_id,
  quantity: row.quantity,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findById = async (id: number): Promise<PurchaseRequest | null> => {
  const row = await queryOne<PurchaseRequestRow>(
    'SELECT * FROM purchase_requests WHERE id = ?',
    [id]
  );
  return row ? mapRowToPR(row) : null;
};

export const findByPRNumber = async (prNumber: string): Promise<PurchaseRequest | null> => {
  const row = await queryOne<PurchaseRequestRow>(
    'SELECT * FROM purchase_requests WHERE pr_number = ?',
    [prNumber]
  );
  return row ? mapRowToPR(row) : null;
};

export const findAll = async (filters?: {
  status?: string;
  approvalStatus?: string;
  requestorId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<PurchaseRequest[]> => {
  let sql = 'SELECT * FROM purchase_requests WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.approvalStatus) {
    sql += ' AND approval_status = ?';
    params.push(filters.approvalStatus);
  }

  if (filters?.requestorId) {
    sql += ' AND requestor_id = ?';
    params.push(filters.requestorId);
  }

  if (filters?.fromDate) {
    sql += ' AND request_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND request_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY request_date DESC, created_at DESC';

  const rows = await query<PurchaseRequestRow[]>(sql, params);
  return rows.map(mapRowToPR);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    approvalStatus?: string;
    requestorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: PurchaseRequest[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.approvalStatus) {
    whereClause += ' AND approval_status = ?';
    params.push(filters.approvalStatus);
  }

  if (filters?.requestorId) {
    whereClause += ' AND requestor_id = ?';
    params.push(filters.requestorId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND request_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND request_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM purchase_requests${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<PurchaseRequestRow[]>(
    `SELECT * FROM purchase_requests${whereClause} 
     ORDER BY request_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToPR),
    total,
  };
};

export const findLinesByPR = async (prId: number): Promise<PurchaseRequestLine[]> => {
  const rows = await query<PurchaseRequestLineRow[]>(
    'SELECT * FROM purchase_request_lines WHERE pr_id = ? ORDER BY line_number',
    [prId]
  );
  return rows.map(mapRowToPRLine);
};

export const create = async (data: {
  prNumber: string;
  requestDate: Date;
  requiredDate: Date;
  requestorId: number;
  justification?: string;
  status?: 'draft' | 'pending_approval';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO purchase_requests 
     (pr_number, request_date, required_date, requestor_id, justification, status, approval_status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.prNumber,
      data.requestDate,
      data.requiredDate,
      data.requestorId,
      data.justification,
      data.status || 'draft',
      data.approvalStatus || 'pending',
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const createLine = async (data: {
  prId: number;
  lineNumber: number;
  itemId: number;
  quantity: number;
  notes?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO purchase_request_lines 
     (pr_id, line_number, item_id, quantity, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [data.prId, data.lineNumber, data.itemId, data.quantity, data.notes]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    requiredDate?: Date;
    justification?: string;
    status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po' | 'cancelled';
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvedBy?: number;
    approvedAt?: Date;
    rejectionReason?: string;
    poId?: number;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.requiredDate !== undefined) {
    fields.push('required_date = ?');
    values.push(data.requiredDate);
  }
  if (data.justification !== undefined) {
    fields.push('justification = ?');
    values.push(data.justification);
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
  if (data.rejectionReason !== undefined) {
    fields.push('rejection_reason = ?');
    values.push(data.rejectionReason);
  }
  if (data.poId !== undefined) {
    fields.push('po_id = ?');
    values.push(data.poId);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE purchase_requests SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const updateLine = async (
  id: number,
  data: {
    quantity?: number;
    notes?: string;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(data.quantity);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE purchase_request_lines SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deletePR = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM purchase_requests WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteLine = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM purchase_request_lines WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteLinesByPR = async (prId: number): Promise<boolean> => {
  const result = await execute('DELETE FROM purchase_request_lines WHERE pr_id = ?', [prId]);
  return result.affectedRows > 0;
};
