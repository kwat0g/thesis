import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Role } from '@/lib/types/auth';

export interface RoleRow extends RowDataPacket {
  id: number;
  role_code: string;
  role_name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const mapRowToRole = (row: RoleRow): Role => ({
  id: row.id,
  roleCode: row.role_code,
  roleName: row.role_name,
  description: row.description,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findById = async (id: number): Promise<Role | null> => {
  const row = await queryOne<RoleRow>(
    'SELECT * FROM roles WHERE id = ?',
    [id]
  );
  return row ? mapRowToRole(row) : null;
};

export const findByCode = async (roleCode: string): Promise<Role | null> => {
  const row = await queryOne<RoleRow>(
    'SELECT * FROM roles WHERE role_code = ?',
    [roleCode]
  );
  return row ? mapRowToRole(row) : null;
};

export const findAll = async (): Promise<Role[]> => {
  const rows = await query<RoleRow[]>(
    'SELECT * FROM roles ORDER BY role_name'
  );
  return rows.map(mapRowToRole);
};

export const findActive = async (): Promise<Role[]> => {
  const rows = await query<RoleRow[]>(
    'SELECT * FROM roles WHERE is_active = TRUE ORDER BY role_name'
  );
  return rows.map(mapRowToRole);
};

export const create = async (data: {
  roleCode: string;
  roleName: string;
  description?: string;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO roles (role_code, role_name, description)
     VALUES (?, ?, ?)`,
    [data.roleCode, data.roleName, data.description]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    roleName?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.roleName !== undefined) {
    fields.push('role_name = ?');
    values.push(data.roleName);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(data.isActive);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE roles SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const assignPermission = async (
  roleId: number,
  permissionId: number
): Promise<boolean> => {
  try {
    await execute(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permissionId]
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const removePermission = async (
  roleId: number,
  permissionId: number
): Promise<boolean> => {
  const result = await execute(
    'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
    [roleId, permissionId]
  );
  return result.affectedRows > 0;
};

export const getRolePermissions = async (roleId: number): Promise<number[]> => {
  const rows = await query<RowDataPacket[]>(
    'SELECT permission_id FROM role_permissions WHERE role_id = ?',
    [roleId]
  );
  return rows.map(row => row.permission_id);
};
