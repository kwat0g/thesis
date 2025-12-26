import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Department } from '@/lib/types/master-data';

export interface DepartmentRow extends RowDataPacket {
  id: number;
  dept_code: string;
  dept_name: string;
  description?: string;
  manager_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToDepartment = (row: DepartmentRow): Department => ({
  id: row.id,
  deptCode: row.dept_code,
  deptName: row.dept_name,
  description: row.description,
  managerId: row.manager_id,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<Department | null> => {
  const row = await queryOne<DepartmentRow>(
    'SELECT * FROM departments WHERE id = ?',
    [id]
  );
  return row ? mapRowToDepartment(row) : null;
};

export const findByCode = async (deptCode: string): Promise<Department | null> => {
  const row = await queryOne<DepartmentRow>(
    'SELECT * FROM departments WHERE dept_code = ?',
    [deptCode]
  );
  return row ? mapRowToDepartment(row) : null;
};

export const findAll = async (isActive?: boolean): Promise<Department[]> => {
  let sql = 'SELECT * FROM departments';
  const params: any[] = [];

  if (isActive !== undefined) {
    sql += ' WHERE is_active = ?';
    params.push(isActive);
  }

  sql += ' ORDER BY dept_name';

  const rows = await query<DepartmentRow[]>(sql, params);
  return rows.map(mapRowToDepartment);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  isActive?: boolean
): Promise<{ data: Department[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params: any[] = [];

  if (isActive !== undefined) {
    whereClause = ' WHERE is_active = ?';
    params.push(isActive);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM departments${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<DepartmentRow[]>(
    `SELECT * FROM departments${whereClause} ORDER BY dept_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToDepartment),
    total,
  };
};

export const create = async (data: {
  deptCode: string;
  deptName: string;
  description?: string;
  managerId?: number;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO departments (dept_code, dept_name, description, manager_id, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [data.deptCode, data.deptName, data.description, data.managerId, data.createdBy]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    deptName?: string;
    description?: string;
    managerId?: number;
    isActive?: boolean;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.deptName !== undefined) {
    fields.push('dept_name = ?');
    values.push(data.deptName);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.managerId !== undefined) {
    fields.push('manager_id = ?');
    values.push(data.managerId);
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
    `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteDepartment = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM departments WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: false, updatedBy });
};

export const activate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: true, updatedBy });
};
