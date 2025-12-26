import * as attendanceRepository from '@/lib/repositories/hr/attendanceRepository';
import * as employeeRepository from '@/lib/repositories/master-data/employeeRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { AttendanceRecord } from '@/lib/types/hr';
import { PaginatedResponse } from '@/lib/types/common';

export const getAttendanceById = async (id: number): Promise<AttendanceRecord | null> => {
  return await attendanceRepository.findById(id);
};

export const getAttendanceByEmployeeAndDate = async (
  employeeId: number,
  attendanceDate: Date
): Promise<AttendanceRecord | null> => {
  return await attendanceRepository.findByEmployeeAndDate(employeeId, attendanceDate);
};

export const getAttendanceByEmployee = async (
  employeeId: number,
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    status?: string;
  }
): Promise<AttendanceRecord[]> => {
  return await attendanceRepository.findByEmployee(employeeId, filters);
};

export const getAllAttendance = async (filters?: {
  employeeId?: number;
  fromDate?: Date;
  toDate?: Date;
  status?: string;
  source?: string;
}): Promise<AttendanceRecord[]> => {
  return await attendanceRepository.findAll(filters);
};

export const getAttendancePaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    employeeId?: number;
    fromDate?: Date;
    toDate?: Date;
    status?: string;
    source?: string;
  }
): Promise<PaginatedResponse<AttendanceRecord>> => {
  const { data, total } = await attendanceRepository.findPaginated(page, pageSize, filters);
  
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

export const recordAttendance = async (
  data: {
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
  },
  createdBy?: number
): Promise<number> => {
  const employee = await employeeRepository.findById(data.employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  if (employee.employmentStatus !== 'active') {
    throw new Error('Cannot record attendance for inactive employee');
  }

  const existing = await attendanceRepository.findByEmployeeAndDate(
    data.employeeId,
    data.attendanceDate
  );
  if (existing) {
    throw new Error('Attendance record already exists for this employee and date');
  }

  let hoursWorked = data.hoursWorked || 0;
  let overtimeHours = data.overtimeHours || 0;

  if (data.timeIn && data.timeOut) {
    const diffMs = new Date(data.timeOut).getTime() - new Date(data.timeIn).getTime();
    const totalHours = diffMs / (1000 * 60 * 60);
    
    const standardHours = 8;
    hoursWorked = Math.min(totalHours, standardHours);
    overtimeHours = Math.max(0, totalHours - standardHours);
  }

  const attendanceId = await attendanceRepository.create({
    employeeId: data.employeeId,
    attendanceDate: data.attendanceDate,
    shiftId: data.shiftId,
    timeIn: data.timeIn,
    timeOut: data.timeOut,
    hoursWorked,
    overtimeHours,
    status: data.status,
    source: data.source,
    notes: data.notes,
    importedFrom: data.importedFrom,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'RECORD_ATTENDANCE',
    module: 'HR',
    recordType: 'attendance_record',
    recordId: attendanceId,
    newValues: {
      employeeId: data.employeeId,
      attendanceDate: data.attendanceDate,
      source: data.source || 'manual',
    },
  });

  return attendanceId;
};

export const updateAttendance = async (
  id: number,
  data: {
    shiftId?: number;
    timeIn?: Date;
    timeOut?: Date;
    hoursWorked?: number;
    overtimeHours?: number;
    status?: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    notes?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existing = await attendanceRepository.findById(id);
  if (!existing) {
    throw new Error('Attendance record not found');
  }

  if (existing.source === 'biometric_import') {
    throw new Error('Cannot manually update biometric-imported attendance records');
  }

  let updateData = { ...data, updatedBy };

  if (data.timeIn && data.timeOut) {
    const diffMs = new Date(data.timeOut).getTime() - new Date(data.timeIn).getTime();
    const totalHours = diffMs / (1000 * 60 * 60);
    
    const standardHours = 8;
    updateData.hoursWorked = Math.min(totalHours, standardHours);
    updateData.overtimeHours = Math.max(0, totalHours - standardHours);
  }

  const success = await attendanceRepository.update(id, updateData);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_ATTENDANCE',
      module: 'HR',
      recordType: 'attendance_record',
      recordId: id,
      oldValues: {
        status: existing.status,
        hoursWorked: existing.hoursWorked,
      },
      newValues: data,
    });
  }

  return success;
};

export const deleteAttendance = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existing = await attendanceRepository.findById(id);
  if (!existing) {
    throw new Error('Attendance record not found');
  }

  if (existing.source === 'biometric_import') {
    throw new Error('Cannot delete biometric-imported attendance records');
  }

  const success = await attendanceRepository.deleteAttendance(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE_ATTENDANCE',
      module: 'HR',
      recordType: 'attendance_record',
      recordId: id,
      oldValues: {
        employeeId: existing.employeeId,
        attendanceDate: existing.attendanceDate,
      },
    });
  }

  return success;
};

export const importBiometricAttendance = async (
  records: Array<{
    employeeId: number;
    attendanceDate: Date;
    timeIn?: Date;
    timeOut?: Date;
    notes?: string;
  }>,
  importedFrom: string,
  importedBy?: number
): Promise<{ imported: number; skipped: number; errors: string[] }> => {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const record of records) {
    try {
      const existing = await attendanceRepository.findByEmployeeAndDate(
        record.employeeId,
        record.attendanceDate
      );

      if (existing) {
        skipped++;
        continue;
      }

      const employee = await employeeRepository.findById(record.employeeId);
      if (!employee || employee.employmentStatus !== 'active') {
        skipped++;
        continue;
      }

      let hoursWorked = 0;
      let overtimeHours = 0;

      if (record.timeIn && record.timeOut) {
        const diffMs = new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        
        const standardHours = 8;
        hoursWorked = Math.min(totalHours, standardHours);
        overtimeHours = Math.max(0, totalHours - standardHours);
      }

      await attendanceRepository.create({
        employeeId: record.employeeId,
        attendanceDate: record.attendanceDate,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        hoursWorked,
        overtimeHours,
        status: 'present',
        source: 'biometric_import',
        notes: record.notes,
        importedFrom,
        createdBy: importedBy,
      });

      imported++;
    } catch (error: any) {
      errors.push(`Employee ${record.employeeId}: ${error.message}`);
    }
  }

  if (imported > 0) {
    await auditLogRepository.create({
      userId: importedBy,
      action: 'IMPORT_BIOMETRIC_ATTENDANCE',
      module: 'HR',
      recordType: 'attendance_import',
      newValues: {
        importedFrom,
        totalRecords: records.length,
        imported,
        skipped,
      },
    });
  }

  return { imported, skipped, errors };
};

export const getAttendanceSummary = async (
  employeeId: number,
  fromDate: Date,
  toDate: Date
) => {
  return await attendanceRepository.getAttendanceSummary(employeeId, fromDate, toDate);
};
