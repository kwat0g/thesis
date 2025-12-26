import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { User } from '@/lib/types/auth';

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  employee_id?: number;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  email: row.email,
  passwordHash: row.password_hash,
  employeeId: row.employee_id,
  isActive: row.is_active,
  lastLogin: row.last_login,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<User | null> => {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return row ? mapRowToUser(row) : null;
};

export const findByUsername = async (username: string): Promise<User | null> => {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return row ? mapRowToUser(row) : null;
};

export const findByEmail = async (email: string): Promise<User | null> => {
  const row = await queryOne<UserRow>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return row ? mapRowToUser(row) : null;
};

export const findAll = async (): Promise<User[]> => {
  const rows = await query<UserRow[]>(
    'SELECT * FROM users ORDER BY username'
  );
  return rows.map(mapRowToUser);
};

export const create = async (data: {
  username: string;
  email: string;
  passwordHash: string;
  employeeId?: number;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO users (username, email, password_hash, employee_id, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [data.username, data.email, data.passwordHash, data.employeeId, data.createdBy]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    email?: string;
    passwordHash?: string;
    employeeId?: number;
    isActive?: boolean;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    values.push(data.passwordHash);
  }
  if (data.employeeId !== undefined) {
    fields.push('employee_id = ?');
    values.push(data.employeeId);
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
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const updateLastLogin = async (id: number): Promise<boolean> => {
  const result = await execute(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const getUserRoles = async (userId: number): Promise<string[]> => {
  const rows = await query<RowDataPacket[]>(
    `SELECT r.role_code
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ? AND r.is_active = TRUE`,
    [userId]
  );
  return rows.map(row => row.role_code);
};

export const getUserPermissions = async (userId: number): Promise<string[]> => {
  const rows = await query<RowDataPacket[]>(
    `SELECT DISTINCT p.permission_code
     FROM user_roles ur
     JOIN role_permissions rp ON ur.role_id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ? AND r.is_active = TRUE`,
    [userId]
  );
  return rows.map(row => row.permission_code);
};
