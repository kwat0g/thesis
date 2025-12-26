import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { UnitOfMeasure } from '@/lib/types/master-data';

export interface UOMRow extends RowDataPacket {
  id: number;
  uom_code: string;
  uom_name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const mapRowToUOM = (row: UOMRow): UnitOfMeasure => ({
  id: row.id,
  uomCode: row.uom_code,
  uomName: row.uom_name,
  description: row.description,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findById = async (id: number): Promise<UnitOfMeasure | null> => {
  const row = await queryOne<UOMRow>('SELECT * FROM units_of_measure WHERE id = ?', [id]);
  return row ? mapRowToUOM(row) : null;
};

export const findByCode = async (uomCode: string): Promise<UnitOfMeasure | null> => {
  const row = await queryOne<UOMRow>('SELECT * FROM units_of_measure WHERE uom_code = ?', [uomCode]);
  return row ? mapRowToUOM(row) : null;
};

export const findAll = async (isActive?: boolean): Promise<UnitOfMeasure[]> => {
  let sql = 'SELECT * FROM units_of_measure';
  const params: any[] = [];
  if (isActive !== undefined) {
    sql += ' WHERE is_active = ?';
    params.push(isActive);
  }
  sql += ' ORDER BY uom_name';
  const rows = await query<UOMRow[]>(sql, params);
  return rows.map(mapRowToUOM);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  isActive?: boolean
): Promise<{ data: UnitOfMeasure[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  let whereClause = '';
  const params: any[] = [];
  if (isActive !== undefined) {
    whereClause = ' WHERE is_active = ?';
    params.push(isActive);
  }
  const countResult = await queryOne<RowDataPacket>(`SELECT COUNT(*) as total FROM units_of_measure${whereClause}`, params);
  const total = countResult?.total || 0;
  const rows = await query<UOMRow[]>(
    `SELECT * FROM units_of_measure${whereClause} ORDER BY uom_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { data: rows.map(mapRowToUOM), total };
};

export const create = async (data: {
  uomCode: string;
  uomName: string;
  description?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO units_of_measure (uom_code, uom_name, description) VALUES (?, ?, ?)`,
    [data.uomCode, data.uomName, data.description]
  );
  return result.insertId;
};

export const update = async (id: number, data: {
  uomName?: string;
  description?: string;
  isActive?: boolean;
}): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.uomName !== undefined) { fields.push('uom_name = ?'); values.push(data.uomName); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive); }
  if (fields.length === 0) return false;
  values.push(id);
  const result = await execute(`UPDATE units_of_measure SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

export const deleteUOM = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM units_of_measure WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number): Promise<boolean> => {
  return update(id, { isActive: false });
};

export const activate = async (id: number): Promise<boolean> => {
  return update(id, { isActive: true });
};
