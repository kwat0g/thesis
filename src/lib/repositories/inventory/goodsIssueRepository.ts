import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { GoodsIssue, GoodsIssueLine } from '@/lib/types/inventory';

export interface GoodsIssueRow extends RowDataPacket {
  id: number;
  gi_number: string;
  production_order_id: number;
  issue_date: Date;
  warehouse_id: number;
  issued_by: number;
  status: 'draft' | 'completed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface GoodsIssueLineRow extends RowDataPacket {
  id: number;
  gi_id: number;
  line_number: number;
  item_id: number;
  quantity_issued: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const mapRowToGI = (row: GoodsIssueRow): GoodsIssue => ({
  id: row.id,
  giNumber: row.gi_number,
  productionOrderId: row.production_order_id,
  issueDate: row.issue_date,
  warehouseId: row.warehouse_id,
  issuedBy: row.issued_by,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

const mapRowToGILine = (row: GoodsIssueLineRow): GoodsIssueLine => ({
  id: row.id,
  giId: row.gi_id,
  lineNumber: row.line_number,
  itemId: row.item_id,
  quantityIssued: row.quantity_issued,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findById = async (id: number): Promise<GoodsIssue | null> => {
  const row = await queryOne<GoodsIssueRow>(
    'SELECT * FROM goods_issues WHERE id = ?',
    [id]
  );
  return row ? mapRowToGI(row) : null;
};

export const findByGINumber = async (giNumber: string): Promise<GoodsIssue | null> => {
  const row = await queryOne<GoodsIssueRow>(
    'SELECT * FROM goods_issues WHERE gi_number = ?',
    [giNumber]
  );
  return row ? mapRowToGI(row) : null;
};

export const findByProductionOrder = async (productionOrderId: number): Promise<GoodsIssue[]> => {
  const rows = await query<GoodsIssueRow[]>(
    'SELECT * FROM goods_issues WHERE production_order_id = ? ORDER BY issue_date DESC',
    [productionOrderId]
  );
  return rows.map(mapRowToGI);
};

export const findAll = async (filters?: {
  status?: string;
  warehouseId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<GoodsIssue[]> => {
  let sql = 'SELECT * FROM goods_issues WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.warehouseId) {
    sql += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  if (filters?.fromDate) {
    sql += ' AND issue_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND issue_date <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY issue_date DESC, created_at DESC';

  const rows = await query<GoodsIssueRow[]>(sql, params);
  return rows.map(mapRowToGI);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    warehouseId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<{ data: GoodsIssue[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.warehouseId) {
    whereClause += ' AND warehouse_id = ?';
    params.push(filters.warehouseId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND issue_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND issue_date <= ?';
    params.push(filters.toDate);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM goods_issues${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<GoodsIssueRow[]>(
    `SELECT * FROM goods_issues${whereClause} 
     ORDER BY issue_date DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToGI),
    total,
  };
};

export const findLinesByGI = async (giId: number): Promise<GoodsIssueLine[]> => {
  const rows = await query<GoodsIssueLineRow[]>(
    'SELECT * FROM goods_issue_lines WHERE gi_id = ? ORDER BY line_number',
    [giId]
  );
  return rows.map(mapRowToGILine);
};

export const create = async (data: {
  giNumber: string;
  productionOrderId: number;
  issueDate: Date;
  warehouseId: number;
  issuedBy: number;
  status?: 'draft' | 'completed';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO goods_issues 
     (gi_number, production_order_id, issue_date, warehouse_id, issued_by, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.giNumber,
      data.productionOrderId,
      data.issueDate,
      data.warehouseId,
      data.issuedBy,
      data.status || 'draft',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const createLine = async (data: {
  giId: number;
  lineNumber: number;
  itemId: number;
  quantityIssued: number;
  notes?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO goods_issue_lines 
     (gi_id, line_number, item_id, quantity_issued, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.giId,
      data.lineNumber,
      data.itemId,
      data.quantityIssued,
      data.notes,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    status?: 'draft' | 'completed' | 'cancelled';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

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
    `UPDATE goods_issues SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteGI = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM goods_issues WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deleteLinesByGI = async (giId: number): Promise<boolean> => {
  const result = await execute('DELETE FROM goods_issue_lines WHERE gi_id = ?', [giId]);
  return result.affectedRows > 0;
};
