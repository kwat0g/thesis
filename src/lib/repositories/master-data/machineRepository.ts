import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Machine } from '@/lib/types/master-data';

export interface MachineRow extends RowDataPacket {
  id: number;
  machine_code: string;
  machine_name: string;
  machine_type?: string;
  department_id?: number;
  capacity_per_hour?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'breakdown';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToMachine = (row: MachineRow): Machine => ({
  id: row.id,
  machineCode: row.machine_code,
  machineName: row.machine_name,
  machineType: row.machine_type,
  departmentId: row.department_id,
  capacityPerHour: row.capacity_per_hour,
  status: row.status,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<Machine | null> => {
  const row = await queryOne<MachineRow>('SELECT * FROM machines WHERE id = ?', [id]);
  return row ? mapRowToMachine(row) : null;
};

export const findByCode = async (machineCode: string): Promise<Machine | null> => {
  const row = await queryOne<MachineRow>('SELECT * FROM machines WHERE machine_code = ?', [machineCode]);
  return row ? mapRowToMachine(row) : null;
};

export const findAll = async (filters?: { isActive?: boolean; status?: string }): Promise<Machine[]> => {
  let sql = 'SELECT * FROM machines WHERE 1=1';
  const params: any[] = [];
  if (filters?.isActive !== undefined) { sql += ' AND is_active = ?'; params.push(filters.isActive); }
  if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
  sql += ' ORDER BY machine_name';
  const rows = await query<MachineRow[]>(sql, params);
  return rows.map(mapRowToMachine);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: { isActive?: boolean; status?: string }
): Promise<{ data: Machine[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];
  if (filters?.isActive !== undefined) { whereClause += ' AND is_active = ?'; params.push(filters.isActive); }
  if (filters?.status) { whereClause += ' AND status = ?'; params.push(filters.status); }
  const countResult = await queryOne<RowDataPacket>(`SELECT COUNT(*) as total FROM machines${whereClause}`, params);
  const total = countResult?.total || 0;
  const rows = await query<MachineRow[]>(
    `SELECT * FROM machines${whereClause} ORDER BY machine_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return { data: rows.map(mapRowToMachine), total };
};

export const create = async (data: {
  machineCode: string;
  machineName: string;
  machineType?: string;
  departmentId?: number;
  capacityPerHour?: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'breakdown';
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO machines (machine_code, machine_name, machine_type, department_id, capacity_per_hour, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.machineCode, data.machineName, data.machineType, data.departmentId, data.capacityPerHour, data.status || 'available', data.createdBy]
  );
  return result.insertId;
};

export const update = async (id: number, data: {
  machineName?: string;
  machineType?: string;
  departmentId?: number;
  capacityPerHour?: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'breakdown';
  isActive?: boolean;
  updatedBy?: number;
}): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.machineName !== undefined) { fields.push('machine_name = ?'); values.push(data.machineName); }
  if (data.machineType !== undefined) { fields.push('machine_type = ?'); values.push(data.machineType); }
  if (data.departmentId !== undefined) { fields.push('department_id = ?'); values.push(data.departmentId); }
  if (data.capacityPerHour !== undefined) { fields.push('capacity_per_hour = ?'); values.push(data.capacityPerHour); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive); }
  if (data.updatedBy !== undefined) { fields.push('updated_by = ?'); values.push(data.updatedBy); }
  if (fields.length === 0) return false;
  values.push(id);
  const result = await execute(`UPDATE machines SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

export const deleteMachine = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM machines WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: false, updatedBy });
};

export const activate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: true, updatedBy });
};
