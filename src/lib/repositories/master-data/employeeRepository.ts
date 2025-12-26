import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { Employee } from '@/lib/types/master-data';

export interface EmployeeRow extends RowDataPacket {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department_id?: number;
  position?: string;
  hire_date?: Date;
  employment_status: 'active' | 'on_leave' | 'resigned' | 'terminated';
  salary?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToEmployee = (row: EmployeeRow): Employee => ({
  id: row.id,
  employeeCode: row.employee_code,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  departmentId: row.department_id,
  position: row.position,
  hireDate: row.hire_date,
  employmentStatus: row.employment_status,
  salary: row.salary,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<Employee | null> => {
  const row = await queryOne<EmployeeRow>(
    'SELECT * FROM employees WHERE id = ?',
    [id]
  );
  return row ? mapRowToEmployee(row) : null;
};

export const findByCode = async (employeeCode: string): Promise<Employee | null> => {
  const row = await queryOne<EmployeeRow>(
    'SELECT * FROM employees WHERE employee_code = ?',
    [employeeCode]
  );
  return row ? mapRowToEmployee(row) : null;
};

export const findByEmail = async (email: string): Promise<Employee | null> => {
  const row = await queryOne<EmployeeRow>(
    'SELECT * FROM employees WHERE email = ?',
    [email]
  );
  return row ? mapRowToEmployee(row) : null;
};

export const findAll = async (filters?: {
  isActive?: boolean;
  departmentId?: number;
  employmentStatus?: string;
}): Promise<Employee[]> => {
  let sql = 'SELECT * FROM employees WHERE 1=1';
  const params: any[] = [];

  if (filters?.isActive !== undefined) {
    sql += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  if (filters?.departmentId !== undefined) {
    sql += ' AND department_id = ?';
    params.push(filters.departmentId);
  }

  if (filters?.employmentStatus) {
    sql += ' AND employment_status = ?';
    params.push(filters.employmentStatus);
  }

  sql += ' ORDER BY last_name, first_name';

  const rows = await query<EmployeeRow[]>(sql, params);
  return rows.map(mapRowToEmployee);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    isActive?: boolean;
    departmentId?: number;
    employmentStatus?: string;
  }
): Promise<{ data: Employee[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.isActive !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  if (filters?.departmentId !== undefined) {
    whereClause += ' AND department_id = ?';
    params.push(filters.departmentId);
  }

  if (filters?.employmentStatus) {
    whereClause += ' AND employment_status = ?';
    params.push(filters.employmentStatus);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM employees${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<EmployeeRow[]>(
    `SELECT * FROM employees${whereClause} ORDER BY last_name, first_name LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToEmployee),
    total,
  };
};

export const create = async (data: {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  departmentId?: number;
  position?: string;
  hireDate?: Date;
  employmentStatus?: 'active' | 'on_leave' | 'resigned' | 'terminated';
  salary?: number;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO employees 
     (employee_code, first_name, last_name, email, phone, department_id, position, hire_date, employment_status, salary, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.employeeCode,
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.departmentId,
      data.position,
      data.hireDate,
      data.employmentStatus || 'active',
      data.salary,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    departmentId?: number;
    position?: string;
    hireDate?: Date;
    employmentStatus?: 'active' | 'on_leave' | 'resigned' | 'terminated';
    salary?: number;
    isActive?: boolean;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.firstName !== undefined) {
    fields.push('first_name = ?');
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    fields.push('last_name = ?');
    values.push(data.lastName);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone);
  }
  if (data.departmentId !== undefined) {
    fields.push('department_id = ?');
    values.push(data.departmentId);
  }
  if (data.position !== undefined) {
    fields.push('position = ?');
    values.push(data.position);
  }
  if (data.hireDate !== undefined) {
    fields.push('hire_date = ?');
    values.push(data.hireDate);
  }
  if (data.employmentStatus !== undefined) {
    fields.push('employment_status = ?');
    values.push(data.employmentStatus);
  }
  if (data.salary !== undefined) {
    fields.push('salary = ?');
    values.push(data.salary);
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
    `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteEmployee = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM employees WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const deactivate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: false, updatedBy });
};

export const activate = async (id: number, updatedBy?: number): Promise<boolean> => {
  return update(id, { isActive: true, updatedBy });
};
