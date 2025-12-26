import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute } from '@/lib/database/query';
import { AttendanceRecord } from '@/lib/types/hr';

export interface AttendanceRecordRow extends RowDataPacket {
  id: number;
  employee_id: number;
  attendance_date: Date;
  shift_id?: number;
  time_in?: Date;
  time_out?: Date;
  hours_worked: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  source: 'manual' | 'biometric_import';
  notes?: string;
  imported_from?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

const mapRowToAttendance = (row: AttendanceRecordRow): AttendanceRecord => ({
  id: row.id,
  employeeId: row.employee_id,
  attendanceDate: row.attendance_date,
  shiftId: row.shift_id,
  timeIn: row.time_in,
  timeOut: row.time_out,
  hoursWorked: row.hours_worked,
  overtimeHours: row.overtime_hours,
  status: row.status,
  source: row.source,
  notes: row.notes,
  importedFrom: row.imported_from,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
});

export const findById = async (id: number): Promise<AttendanceRecord | null> => {
  const row = await queryOne<AttendanceRecordRow>(
    'SELECT * FROM attendance_records WHERE id = ?',
    [id]
  );
  return row ? mapRowToAttendance(row) : null;
};

export const findByEmployeeAndDate = async (
  employeeId: number,
  attendanceDate: Date
): Promise<AttendanceRecord | null> => {
  const row = await queryOne<AttendanceRecordRow>(
    'SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = ?',
    [employeeId, attendanceDate]
  );
  return row ? mapRowToAttendance(row) : null;
};

export const findByEmployee = async (
  employeeId: number,
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    status?: string;
  }
): Promise<AttendanceRecord[]> => {
  let sql = 'SELECT * FROM attendance_records WHERE employee_id = ?';
  const params: any[] = [employeeId];

  if (filters?.fromDate) {
    sql += ' AND attendance_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND attendance_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY attendance_date DESC';

  const rows = await query<AttendanceRecordRow[]>(sql, params);
  return rows.map(mapRowToAttendance);
};

export const findAll = async (filters?: {
  employeeId?: number;
  fromDate?: Date;
  toDate?: Date;
  status?: string;
  source?: string;
}): Promise<AttendanceRecord[]> => {
  let sql = 'SELECT * FROM attendance_records WHERE 1=1';
  const params: any[] = [];

  if (filters?.employeeId) {
    sql += ' AND employee_id = ?';
    params.push(filters.employeeId);
  }

  if (filters?.fromDate) {
    sql += ' AND attendance_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    sql += ' AND attendance_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.source) {
    sql += ' AND source = ?';
    params.push(filters.source);
  }

  sql += ' ORDER BY attendance_date DESC, employee_id';

  const rows = await query<AttendanceRecordRow[]>(sql, params);
  return rows.map(mapRowToAttendance);
};

export const findPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    employeeId?: number;
    fromDate?: Date;
    toDate?: Date;
    status?: string;
    source?: string;
  }
): Promise<{ data: AttendanceRecord[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (filters?.employeeId) {
    whereClause += ' AND employee_id = ?';
    params.push(filters.employeeId);
  }

  if (filters?.fromDate) {
    whereClause += ' AND attendance_date >= ?';
    params.push(filters.fromDate);
  }

  if (filters?.toDate) {
    whereClause += ' AND attendance_date <= ?';
    params.push(filters.toDate);
  }

  if (filters?.status) {
    whereClause += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.source) {
    whereClause += ' AND source = ?';
    params.push(filters.source);
  }

  const countResult = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM attendance_records${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  const rows = await query<AttendanceRecordRow[]>(
    `SELECT * FROM attendance_records${whereClause} 
     ORDER BY attendance_date DESC, employee_id 
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    data: rows.map(mapRowToAttendance),
    total,
  };
};

export const create = async (data: {
  employeeId: number;
  attendanceDate: Date;
  shiftId?: number;
  timeIn?: Date;
  timeOut?: Date;
  hoursWorked?: number;
  overtimeHours?: number;
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  source?: 'manual' | 'biometric_import';
  notes?: string;
  importedFrom?: string;
  createdBy?: number;
}): Promise<number> => {
  const result = await execute(
    `INSERT INTO attendance_records 
     (employee_id, attendance_date, shift_id, time_in, time_out, hours_worked, 
      overtime_hours, status, source, notes, imported_from, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.employeeId,
      data.attendanceDate,
      data.shiftId,
      data.timeIn,
      data.timeOut,
      data.hoursWorked || 0,
      data.overtimeHours || 0,
      data.status || 'present',
      data.source || 'manual',
      data.notes,
      data.importedFrom,
      data.createdBy,
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: {
    shiftId?: number;
    timeIn?: Date;
    timeOut?: Date;
    hoursWorked?: number;
    overtimeHours?: number;
    status?: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    notes?: string;
    updatedBy?: number;
  }
): Promise<boolean> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.shiftId !== undefined) {
    fields.push('shift_id = ?');
    values.push(data.shiftId);
  }
  if (data.timeIn !== undefined) {
    fields.push('time_in = ?');
    values.push(data.timeIn);
  }
  if (data.timeOut !== undefined) {
    fields.push('time_out = ?');
    values.push(data.timeOut);
  }
  if (data.hoursWorked !== undefined) {
    fields.push('hours_worked = ?');
    values.push(data.hoursWorked);
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
    `UPDATE attendance_records SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

export const deleteAttendance = async (id: number): Promise<boolean> => {
  const result = await execute('DELETE FROM attendance_records WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const getAttendanceSummary = async (
  employeeId: number,
  fromDate: Date,
  toDate: Date
): Promise<{
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  totalOvertimeHours: number;
}> => {
  const row = await queryOne<RowDataPacket>(
    `SELECT 
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(hours_worked) as total_hours,
      SUM(overtime_hours) as total_overtime_hours
     FROM attendance_records 
     WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?`,
    [employeeId, fromDate, toDate]
  );

  return {
    totalDays: row?.total_days || 0,
    presentDays: row?.present_days || 0,
    absentDays: row?.absent_days || 0,
    lateDays: row?.late_days || 0,
    totalHours: row?.total_hours || 0,
    totalOvertimeHours: row?.total_overtime_hours || 0,
  };
};
