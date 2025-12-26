import * as payrollRepository from '@/lib/repositories/hr/payrollRepository';
import * as attendanceRepository from '@/lib/repositories/hr/attendanceRepository';
import * as employeeRepository from '@/lib/repositories/master-data/employeeRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { PayrollPeriod, PayrollRecord } from '@/lib/types/accounting';

export const getPeriodById = async (id: number): Promise<PayrollPeriod | null> => {
  return await payrollRepository.findPeriodById(id);
};

export const getPeriodByCode = async (periodCode: string): Promise<PayrollPeriod | null> => {
  return await payrollRepository.findPeriodByCode(periodCode);
};

export const getAllPeriods = async (filters?: {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<PayrollPeriod[]> => {
  return await payrollRepository.findAllPeriods(filters);
};

const generatePeriodCode = (periodStart: Date): string => {
  const year = periodStart.getFullYear();
  const month = String(periodStart.getMonth() + 1).padStart(2, '0');
  return `PAY-${year}${month}`;
};

export const createPeriod = async (
  data: {
    periodStart: Date;
    periodEnd: Date;
    paymentDate: Date;
  },
  createdBy?: number
): Promise<number> => {
  if (data.periodEnd < data.periodStart) {
    throw new Error('Period end date must be after start date');
  }

  if (data.paymentDate < data.periodEnd) {
    throw new Error('Payment date must be on or after period end date');
  }

  const periodCode = generatePeriodCode(data.periodStart);

  const existing = await payrollRepository.findPeriodByCode(periodCode);
  if (existing) {
    throw new Error('Payroll period already exists for this month');
  }

  const periodId = await payrollRepository.createPeriod({
    periodCode,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    paymentDate: data.paymentDate,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_PAYROLL_PERIOD',
    module: 'HR_PAYROLL',
    recordType: 'payroll_period',
    recordId: periodId,
    newValues: {
      periodCode,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
  });

  return periodId;
};

export const calculatePayroll = async (
  periodId: number,
  calculatedBy?: number
): Promise<{ created: number; updated: number }> => {
  const period = await payrollRepository.findPeriodById(periodId);
  if (!period) {
    throw new Error('Payroll period not found');
  }

  if (period.status !== 'open') {
    throw new Error('Can only calculate payroll for open periods');
  }

  const employees = await employeeRepository.findAll({ isActive: true });
  const activeEmployees = employees.filter(e => e.employmentStatus === 'active');

  let created = 0;
  let updated = 0;

  for (const employee of activeEmployees) {
    const attendanceSummary = await attendanceRepository.getAttendanceSummary(
      employee.id,
      period.periodStart,
      period.periodEnd
    );

    const basicSalary = employee.salary || 0;
    const dailyRate = basicSalary / 22;
    const hourlyRate = dailyRate / 8;

    const grossPay = (attendanceSummary.presentDays * dailyRate);
    const overtimePay = attendanceSummary.totalOvertimeHours * hourlyRate * 1.25;
    
    const deductions = 0;
    const netPay = grossPay + overtimePay - deductions;

    const existingRecord = await payrollRepository.findRecordByPeriodAndEmployee(
      periodId,
      employee.id
    );

    if (existingRecord) {
      await payrollRepository.updateRecord(existingRecord.id, {
        basicSalary: grossPay,
        overtimePay,
        deductions,
        netPay,
        daysWorked: attendanceSummary.presentDays,
        overtimeHours: attendanceSummary.totalOvertimeHours,
        status: 'calculated',
        updatedBy: calculatedBy,
      });
      updated++;
    } else {
      await payrollRepository.createRecord({
        payrollPeriodId: periodId,
        employeeId: employee.id,
        basicSalary: grossPay,
        overtimePay,
        deductions,
        netPay,
        daysWorked: attendanceSummary.presentDays,
        overtimeHours: attendanceSummary.totalOvertimeHours,
        status: 'calculated',
        createdBy: calculatedBy,
      });
      created++;
    }
  }

  const summary = await payrollRepository.getPeriodSummary(periodId);
  
  await payrollRepository.updatePeriod(periodId, {
    status: 'calculated',
    totalEmployees: summary.totalEmployees,
    totalAmount: summary.totalAmount,
    preparedBy: calculatedBy,
    updatedBy: calculatedBy,
  });

  await auditLogRepository.create({
    userId: calculatedBy,
    action: 'CALCULATE_PAYROLL',
    module: 'HR_PAYROLL',
    recordType: 'payroll_period',
    recordId: periodId,
    newValues: {
      status: 'calculated',
      totalEmployees: summary.totalEmployees,
      totalAmount: summary.totalAmount,
    },
  });

  return { created, updated };
};

export const approvePayroll = async (
  periodId: number,
  approvedBy: number
): Promise<boolean> => {
  const period = await payrollRepository.findPeriodById(periodId);
  if (!period) {
    throw new Error('Payroll period not found');
  }

  if (period.status !== 'calculated') {
    throw new Error('Can only approve calculated payroll');
  }

  if (period.preparedBy === approvedBy) {
    throw new Error('Cannot approve payroll you prepared');
  }

  const success = await payrollRepository.updatePeriod(periodId, {
    status: 'approved',
    approvedBy,
    updatedBy: approvedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: approvedBy,
      action: 'APPROVE_PAYROLL',
      module: 'HR_PAYROLL',
      recordType: 'payroll_period',
      recordId: periodId,
      oldValues: { status: 'calculated' },
      newValues: { status: 'approved' },
    });
  }

  return success;
};

export const releasePayroll = async (
  periodId: number,
  releasedBy: number
): Promise<boolean> => {
  const period = await payrollRepository.findPeriodById(periodId);
  if (!period) {
    throw new Error('Payroll period not found');
  }

  if (period.status !== 'approved') {
    throw new Error('Can only release approved payroll');
  }

  if (period.approvedBy === releasedBy || period.preparedBy === releasedBy) {
    throw new Error('Cannot release payroll you prepared or approved');
  }

  const success = await payrollRepository.updatePeriod(periodId, {
    status: 'released',
    releasedBy,
    updatedBy: releasedBy,
  });

  if (success) {
    const records = await payrollRepository.findRecordsByPeriod(periodId);
    for (const record of records) {
      await payrollRepository.updateRecord(record.id, {
        status: 'approved',
      });
    }

    await auditLogRepository.create({
      userId: releasedBy,
      action: 'RELEASE_PAYROLL',
      module: 'HR_PAYROLL',
      recordType: 'payroll_period',
      recordId: periodId,
      oldValues: { status: 'approved' },
      newValues: { status: 'released' },
    });
  }

  return success;
};

export const closePayroll = async (
  periodId: number,
  closedBy: number
): Promise<boolean> => {
  const period = await payrollRepository.findPeriodById(periodId);
  if (!period) {
    throw new Error('Payroll period not found');
  }

  if (period.status !== 'released') {
    throw new Error('Can only close released payroll');
  }

  const success = await payrollRepository.updatePeriod(periodId, {
    status: 'closed',
    updatedBy: closedBy,
  });

  if (success) {
    const records = await payrollRepository.findRecordsByPeriod(periodId);
    for (const record of records) {
      await payrollRepository.updateRecord(record.id, {
        status: 'paid',
      });
    }

    await auditLogRepository.create({
      userId: closedBy,
      action: 'CLOSE_PAYROLL',
      module: 'HR_PAYROLL',
      recordType: 'payroll_period',
      recordId: periodId,
      oldValues: { status: 'released' },
      newValues: { status: 'closed' },
    });
  }

  return success;
};

export const getPayrollRecords = async (periodId: number): Promise<PayrollRecord[]> => {
  return await payrollRepository.findRecordsByPeriod(periodId);
};

export const getPayrollRecord = async (id: number): Promise<PayrollRecord | null> => {
  return await payrollRepository.findRecordById(id);
};

export const updatePayrollRecord = async (
  id: number,
  data: {
    basicSalary?: number;
    overtimePay?: number;
    allowances?: number;
    deductions?: number;
    notes?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const record = await payrollRepository.findRecordById(id);
  if (!record) {
    throw new Error('Payroll record not found');
  }

  const period = await payrollRepository.findPeriodById(record.payrollPeriodId);
  if (!period) {
    throw new Error('Payroll period not found');
  }

  if (period.status !== 'open' && period.status !== 'calculated') {
    throw new Error('Cannot update payroll records in approved, released, or closed periods');
  }

  const netPay = 
    (data.basicSalary ?? record.basicSalary) +
    (data.overtimePay ?? record.overtimePay) +
    (data.allowances ?? record.allowances) -
    (data.deductions ?? record.deductions);

  const success = await payrollRepository.updateRecord(id, {
    ...data,
    netPay,
    updatedBy,
  });

  if (success) {
    const summary = await payrollRepository.getPeriodSummary(record.payrollPeriodId);
    await payrollRepository.updatePeriod(record.payrollPeriodId, {
      totalAmount: summary.totalAmount,
    });

    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_PAYROLL_RECORD',
      module: 'HR_PAYROLL',
      recordType: 'payroll_record',
      recordId: id,
      oldValues: {
        basicSalary: record.basicSalary,
        netPay: record.netPay,
      },
      newValues: data,
    });
  }

  return success;
};

export const getPayrollSummary = async (periodId: number) => {
  return await payrollRepository.getPeriodSummary(periodId);
};
