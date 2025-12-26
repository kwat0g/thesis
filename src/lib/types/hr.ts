import { BaseEntity } from './common';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  attendanceDate: Date;
  shiftId?: number;
  timeIn?: Date;
  timeOut?: Date;
  hoursWorked: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  source: 'manual' | 'biometric_import';
  notes?: string;
  importedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}

export interface LeaveRequest extends BaseEntity {
  requestNumber: string;
  employeeId: number;
  leaveType: 'annual' | 'sick' | 'emergency' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface LeaveApproval {
  id: number;
  leaveRequestId: number;
  approverId: number;
  approvalLevel: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
  createdAt: Date;
}
