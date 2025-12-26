import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Mold } from '@/lib/types/master-data';

export interface MoldRow extends RowDataPacket {
  id: number;
  mold_code: string;
  mold_name: string;
  mold_type?: string;
  cavity_count: number;
  status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  total_shots: number;
  max_shots?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToMold = (row: MoldRow): Mold => ({
  id: row.id,
  moldCode: row.mold_code,
  moldName: row.mold_name,
  moldType: row.mold_type,
  cavityCount: row.cavity_count,
  status: row.status,
  totalShots: row.total_shots,
  maxShots: row.max_shots,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<Mold | null> => {
  const row = await queryOne<MoldRow>('SELECT * FROM molds WHERE id = ?', [id]);
  return row ? mapRowToMold(row) : null;
};

export const findByCode = async (moldCode: string): Promise<Mold | null> => {
  const row = await queryOne<MoldRow>('SELECT * FROM molds WHERE mold_code = ?', [moldCode]);
  return row ? mapRowToMold(row) : null;
};

export const findAll = async (filters?: { isActive?: boolean; status?: string }): Promise<Mold[]> => {
  let sql = 'SELECT * FROM molds WHERE 1=1';
  const params: any[] = [];
  if (filters?.isActive !== undefined) { sql += ' AND is_active = ?'; params.push(filters.isActive); }
  if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
  sql += ' ORDER BY mold_name';
  const rows = await query<MoldRow[]>(sql, params);
  return rows.map(mapRowToMold);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: { isActive?: boolean; status?: string }
): Promise<{ data: Mold[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];
  if (filters?.isActive !== undefined) { whereClause += ' AND is_active = ?'; params.push(filters.isActive); }
  if (filters?.status) { whereClause += ' AND status = ?'; params.push(filters.status); }
  const countResult = await queryOne<RowDataPacket>(`SELECT COUNT(*) as total FROM molds${whereClause}`, params);
  const total = countResult?.total || 0;
  const rows = await query<MoldRow[]>(
    `SELECT * FROM molds${whereClause} ORDER BY mold_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { data: rows.map(mapRowToMold), total };
};

export const create = async (data: {
  moldCode: string;
  moldName: string;
  moldType?: string;
  cavityCount?: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  totalShots?: number;
  maxShots?: number;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO molds (mold_code, mold_name, mold_type, cavity_count, status, total_shots, max_shots, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.moldCode, data.moldName, data.moldType, data.cavityCount || 1, data.status || 'available', data.totalShots || 0, data.maxShots, data.createdBy]
  );
  return result.insertId;
};

export const update = async (id: number, data: {
  moldName?: string;
  moldType?: string;
  cavityCount?: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  totalShots?: number;
  maxShots?: number;
  isActive?: boolean;
  updatedBy?: number;
}): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.moldName !== undefined) { fields.push('mold_name = ?'); values.push(data.moldName); }
  if (data.moldType !== undefined) { fields.push('mold_type = ?'); values.push(data.moldType); }
  if (data.cavityCount !== undefined) { fields.push('cavity_count = ?'); values.push(data.cavityCount); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.totalShots !== undefined) { fields.push('total_shots = ?'); values.push(data.totalShots); }
  if (data.maxShots !== undefined) { fields.push('max_shots = ?'); values.push(data.maxShots); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive); }
  if (data.updatedBy !== undefined) { fields.push('updated_by = ?'); values.push(data.updatedBy); }
  if (fields.length === 0) return false;
  values.push(id);
  const result = await execute(`UPDATE molds SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

export const deleteMold = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM molds WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: false, updatedBy });
};

export const activate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: true, updatedBy });
};
