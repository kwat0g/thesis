import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { PayrollPeriod, PayrollRecord } from '@/lib/types/accounting';

export interface PayrollPeriodRow extends RowDataPacket {
  id: number;
  period_code: string;
  period_start: Date;
  period_end: Date;
  payment_date: Date;
  status: 'open' | 'calculated' | 'approved' | 'released' | 'closed';
  total_employees: number;
  total_amount: number;
  prepared_by?: number;
  approved_by?: number;
  released_by?: number;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface PayrollRecordRow extends RowDataPacket {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  basic_salary: number;
  overtime_pay: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  days_worked: number;
  overtime_hours: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToPeriod = (row: PayrollPeriodRow): PayrollPeriod => ({
  id: row.id,
  periodCode: row.period_code,
  periodStart: row.period_start,
  periodEnd: row.period_end,
  paymentDate: row.payment_date,
  status: row.status,
  totalEmployees: row.total_employees,
  totalAmount: row.total_amount,
  preparedBy: row.prepared_by,
  approvedBy: row.approved_by,
  releasedBy: row.released_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

const mapRowToRecord = (row: PayrollRecordRow): PayrollRecord => ({
  id: row.id,
  payrollPeriodId: row.payroll_period_id,
  employeeId: row.employee_id,
  basicSalary: row.basic_salary,
  overtimePay: row.overtime_pay,
  allowances: row.allowances,
  deductions: row.deductions,
  netPay: row.net_pay,
  daysWorked: row.days_worked,
  overtimeHours: row.overtime_hours,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

// Payroll Period Repository
export const findPeriodById = async (id: number): Promise<PayrollPeriod | null> => {
  const row = await queryOne<PayrollPeriodRow>(
    'SELECT * FROM payroll_periods WHERE id = ?',
    [id]
  );
  return row ? mapRowToPeriod(row) : null;
};

export const findPeriodByCode = async (periodCode: string): Promise<PayrollPeriod | null> => {
  const row = await queryOne<PayrollPeriodRow>(
    'SELECT * FROM payroll_periods WHERE period_code = ?',
    [periodCode]
  );
  return row ? mapRowToPeriod(row) : null;
};

export const findAllPeriods = async (filters?: {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<PayrollPeriod[]> => {
  let sql = 'SELECT * FROM payroll_periods WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.fromDate) {
    sql += ' AND period_start >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND period_end <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY period_start DESC';

  const rows = await query<PayrollPeriodRow[]>(sql, params);
  return rows.map(mapRowToPeriod);
};

export const createPeriod = async (data: {
  periodCode: string;
  periodStart: Date;
  periodEnd: Date;
  paymentDate: Date;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO payroll_periods 
     (period_code, period_start, period_end, payment_date, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.periodCode,
      data.periodStart,
      data.periodEnd,
      data.paymentDate,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const updatePeriod = async (
  id: number,
  data: {
    status?: 'open' | 'calculated' | 'approved' | 'released' | 'closed';
    totalEmployees?: number;
    totalAmount?: number;
    preparedBy?: number;
    approvedBy?: number;
    releasedBy?: number;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.totalEmployees !== undefined) {
    fields.push('total_employees = ?');
    values.push(data.totalEmployees);
  }
  if (data.totalAmount !== undefined) {
    fields.push('total_amount = ?');
    values.push(data.totalAmount);
  }
  if (data.preparedBy !== undefined) {
    fields.push('prepared_by = ?');
    values.push(data.preparedBy);
  }
  if (data.approvedBy !== undefined) {
    fields.push('approved_by = ?');
    values.push(data.approvedBy);
  }
  if (data.releasedBy !== undefined) {
    fields.push('released_by = ?');
    values.push(data.releasedBy);
  }
  if (data.updatedBy !== undefined) {
    fields.push('updated_by = ?');
    values.push(data.updatedBy);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await execute(
    `UPDATE payroll_periods SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

// Payroll Record Repository
export const findRecordById = async (id: number): Promise<PayrollRecord | null> => {
  const row = await queryOne<PayrollRecordRow>(
    'SELECT * FROM payroll_records WHERE id = ?',
    [id]
  );
  return row ? mapRowToRecord(row) : null;
};

export const findRecordsByPeriod = async (periodId: number): Promise<PayrollRecord[]> => {
  const rows = await query<PayrollRecordRow[]>(
    'SELECT * FROM payroll_records WHERE payroll_period_id = ? ORDER BY employee_id',
    [periodId]
  );
  return rows.map(mapRowToRecord);
};

export const findRecordByPeriodAndEmployee = async (
  periodId: number,
  employeeId: number
): Promise<PayrollRecord | null> => {
  const row = await queryOne<PayrollRecordRow>(
    'SELECT * FROM payroll_records WHERE payroll_period_id = ? AND employee_id = ?',
    [periodId, employeeId]
  );
  return row ? mapRowToRecord(row) : null;
};

export const createRecord = async (data: {
  payrollPeriodId: number;
  employeeId: number;
  basicSalary: number;
  overtimePay?: number;
  allowances?: number;
  deductions?: number;
  netPay: number;
  daysWorked?: number;
  overtimeHours?: number;
  status?: 'draft' | 'calculated' | 'approved' | 'paid';
  notes?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO payroll_records 
     (payroll_period_id, employee_id, basic_salary, overtime_pay, allowances, 
      deductions, net_pay, days_worked, overtime_hours, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.payrollPeriodId,
      data.employeeId,
      data.basicSalary,
      data.overtimePay || 0,
      data.allowances || 0,
      data.deductions || 0,
      data.netPay,
      data.daysWorked || 0,
      data.overtimeHours || 0,
      data.status || 'draft',
      data.notes,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const updateRecord = async (
  id: number,
  data: {
    basicSalary?: number;
    overtimePay?: number;
    allowances?: number;
    deductions?: number;
    netPay?: number;
    daysWorked?: number;
    overtimeHours?: number;
    status?: 'draft' | 'calculated' | 'approved' | 'paid';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.basicSalary !== undefined) {
    fields.push('basic_salary = ?');
    values.push(data.basicSalary);
  }
  if (data.overtimePay !== undefined) {
    fields.push('overtime_pay = ?');
    values.push(data.overtimePay);
  }
  if (data.allowances !== undefined) {
    fields.push('allowances = ?');
    values.push(data.allowances);
  }
  if (data.deductions !== undefined) {
    fields.push('deductions = ?');
    values.push(data.deductions);
  }
  if (data.netPay !== undefined) {
    fields.push('net_pay = ?');
    values.push(data.netPay);
  }
  if (data.daysWorked !== undefined) {
    fields.push('days_worked = ?');
    values.push(data.daysWorked);
  }
  if (data.overtimeHours !== undefined) {
    fields.push('overtime_hours = ?');
    values.push(data.overtimeHours);
  }
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
    `UPDATE payroll_records SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteRecord = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM payroll_records WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const getPeriodSummary = async (periodId: number) => {
  const row = await queryOne<RowDataPacket>(
    `SELECT 
      COUNT(*) as total_employees,
      SUM(net_pay) as total_amount,
      SUM(basic_salary) as total_basic,
      SUM(overtime_pay) as total_overtime,
      SUM(allowances) as total_allowances,
      SUM(deductions) as total_deductions
     FROM payroll_records 
     WHERE payroll_period_id = ?`,
    [periodId]
  );

  return {
    totalEmployees: row?.total_employees || 0,
    totalAmount: row?.total_amount || 0,
    totalBasic: row?.total_basic || 0,
    totalOvertime: row?.total_overtime || 0,
    totalAllowances: row?.total_allowances || 0,
    totalDeductions: row?.total_deductions || 0,
  };
};
