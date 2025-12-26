import * as maintenanceWorkOrderRepository from '@/lib/repositories/maintenance/maintenanceWorkOrderRepository';
import * as maintenanceScheduleRepository from '@/lib/repositories/maintenance/maintenanceScheduleRepository';
import * as maintenanceHistoryRepository from '@/lib/repositories/maintenance/maintenanceHistoryRepository';
import * as downtimeRepository from '@/lib/repositories/production/downtimeRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { MaintenanceWorkOrder } from '@/lib/types/maintenance';
import { PaginatedResponse } from '@/lib/types/common';

export const getWorkOrderById = async (id: number): Promise<MaintenanceWorkOrder | null> => {
  return await maintenanceWorkOrderRepository.findById(id);
};

export const getWorkOrderByNumber = async (mwoNumber: string): Promise<MaintenanceWorkOrder | null> => {
  return await maintenanceWorkOrderRepository.findByMWONumber(mwoNumber);
};

export const getWorkOrdersByMachine = async (machineId: number): Promise<MaintenanceWorkOrder[]> => {
  return await maintenanceWorkOrderRepository.findByMachine(machineId);
};

export const getAllWorkOrders = async (filters?: {
  machineId?: number;
  maintenanceType?: string;
  status?: string;
  approvalStatus?: string;
  priority?: string;
  technicianId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MaintenanceWorkOrder[]> => {
  return await maintenanceWorkOrderRepository.findAll(filters);
};

export const getWorkOrdersPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    machineId?: number;
    maintenanceType?: string;
    status?: string;
    approvalStatus?: string;
    priority?: string;
    technicianId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<MaintenanceWorkOrder>> => {
  const { data, total } = await maintenanceWorkOrderRepository.findPaginated(page, pageSize, filters);
  
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

const generateMWONumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `MWO-${year}${month}${day}-${time}`;
};

export const createWorkOrder = async (
  data: {
    machineId: number;
    maintenanceScheduleId?: number;
    productionDowntimeId?: number;
    maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'inspection';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    problemDescription: string;
    estimatedDurationHours?: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  if (data.productionDowntimeId) {
    const downtime = await downtimeRepository.findById(data.productionDowntimeId);
    if (!downtime) {
      throw new Error('Production downtime not found');
    }

    const existingMWO = await maintenanceWorkOrderRepository.findByDowntime(data.productionDowntimeId);
    if (existingMWO) {
      throw new Error('A maintenance work order already exists for this downtime');
    }
  }

  if (data.maintenanceScheduleId) {
    const schedule = await maintenanceScheduleRepository.findById(data.maintenanceScheduleId);
    if (!schedule) {
      throw new Error('Maintenance schedule not found');
    }
    if (!schedule.isActive) {
      throw new Error('Cannot create work order from inactive schedule');
    }
  }

  const mwoNumber = generateMWONumber();

  const mwoId = await maintenanceWorkOrderRepository.create({
    mwoNumber,
    machineId: data.machineId,
    maintenanceScheduleId: data.maintenanceScheduleId,
    productionDowntimeId: data.productionDowntimeId,
    maintenanceType: data.maintenanceType,
    priority: data.priority,
    requestedDate: new Date(),
    problemDescription: data.problemDescription,
    estimatedDurationHours: data.estimatedDurationHours,
    notes: data.notes,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_MAINTENANCE_WORK_ORDER',
    module: 'MAINTENANCE',
    recordType: 'maintenance_work_order',
    recordId: mwoId,
    newValues: {
      mwoNumber,
      machineId: data.machineId,
      maintenanceType: data.maintenanceType,
      priority: data.priority,
    },
  });

  return mwoId;
};

export const approveWorkOrder = async (
  id: number,
  approvedBy: number
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.approvalStatus !== 'pending') {
    throw new Error('Only pending work orders can be approved');
  }

  if (existingMWO.createdBy === approvedBy) {
    throw new Error('Cannot approve your own maintenance work order');
  }

  const success = await maintenanceWorkOrderRepository.update(id, {
    approvalStatus: 'approved',
    status: 'approved',
    approvedBy,
    approvedAt: new Date(),
    updatedBy: approvedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: approvedBy,
      action: 'APPROVE_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: { approvalStatus: 'pending', status: 'pending' },
      newValues: { approvalStatus: 'approved', status: 'approved' },
    });
  }

  return success;
};

export const rejectWorkOrder = async (
  id: number,
  rejectedBy: number,
  reason?: string
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.approvalStatus !== 'pending') {
    throw new Error('Only pending work orders can be rejected');
  }

  if (existingMWO.createdBy === rejectedBy) {
    throw new Error('Cannot reject your own maintenance work order');
  }

  const success = await maintenanceWorkOrderRepository.update(id, {
    approvalStatus: 'rejected',
    status: 'cancelled',
    approvedBy: rejectedBy,
    approvedAt: new Date(),
    notes: reason,
    updatedBy: rejectedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: rejectedBy,
      action: 'REJECT_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: { approvalStatus: 'pending', status: 'pending' },
      newValues: { approvalStatus: 'rejected', status: 'cancelled', reason },
    });
  }

  return success;
};

export const scheduleWorkOrder = async (
  id: number,
  data: {
    scheduledDate: Date;
    assignedTechnicianId?: number;
  },
  scheduledBy?: number
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.status !== 'approved') {
    throw new Error('Only approved work orders can be scheduled');
  }

  const success = await maintenanceWorkOrderRepository.update(id, {
    scheduledDate: data.scheduledDate,
    assignedTechnicianId: data.assignedTechnicianId,
    status: 'scheduled',
    updatedBy: scheduledBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: scheduledBy,
      action: 'SCHEDULE_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: { status: 'approved' },
      newValues: { 
        status: 'scheduled', 
        scheduledDate: data.scheduledDate,
        assignedTechnicianId: data.assignedTechnicianId,
      },
    });
  }

  return success;
};

export const startWorkOrder = async (
  id: number,
  startedBy?: number
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.status !== 'scheduled' && existingMWO.status !== 'approved') {
    throw new Error('Only scheduled or approved work orders can be started');
  }

  const success = await maintenanceWorkOrderRepository.update(id, {
    status: 'in_progress',
    startedDate: new Date(),
    updatedBy: startedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: startedBy,
      action: 'START_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: { status: existingMWO.status },
      newValues: { status: 'in_progress', startedDate: new Date() },
    });
  }

  return success;
};

export const completeWorkOrder = async (
  id: number,
  data: {
    workPerformed: string;
    rootCause?: string;
    correctiveAction?: string;
    actualDurationHours: number;
    partsReplaced?: string;
    findings?: string;
    recommendations?: string;
    nextActionRequired?: boolean;
  },
  completedBy?: number
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.status !== 'in_progress') {
    throw new Error('Only in-progress work orders can be completed');
  }

  const completedDate = new Date();

  const success = await maintenanceWorkOrderRepository.update(id, {
    status: 'completed',
    completedDate,
    workPerformed: data.workPerformed,
    rootCause: data.rootCause,
    correctiveAction: data.correctiveAction,
    actualDurationHours: data.actualDurationHours,
    updatedBy: completedBy,
  });

  if (success) {
    await maintenanceHistoryRepository.create({
      maintenanceWorkOrderId: id,
      machineId: existingMWO.machineId,
      maintenanceType: existingMWO.maintenanceType,
      maintenanceDate: completedDate,
      technicianId: existingMWO.assignedTechnicianId,
      durationHours: data.actualDurationHours,
      workPerformed: data.workPerformed,
      partsReplaced: data.partsReplaced,
      findings: data.findings,
      recommendations: data.recommendations,
      nextActionRequired: data.nextActionRequired,
      createdBy: completedBy,
    });

    if (existingMWO.maintenanceScheduleId) {
      const maintenanceScheduleService = await import('./maintenanceScheduleService');
      await maintenanceScheduleService.updateScheduleAfterMaintenance(
        existingMWO.maintenanceScheduleId,
        completedDate,
        completedBy
      );
    }

    await auditLogRepository.create({
      userId: completedBy,
      action: 'COMPLETE_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: { status: 'in_progress' },
      newValues: { 
        status: 'completed', 
        completedDate,
        actualDurationHours: data.actualDurationHours,
      },
    });
  }

  return success;
};

export const cancelWorkOrder = async (
  id: number,
  cancelledBy?: number,
  reason?: string
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.status === 'completed' || existingMWO.status === 'cancelled') {
    throw new Error('Cannot cancel completed or already cancelled work orders');
  }

  const success = await maintenanceWorkOrderRepository.update(id, {
    status: 'cancelled',
    notes: reason,
    updatedBy: cancelledBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: cancelledBy,
      action: 'CANCEL_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: { status: existingMWO.status },
      newValues: { status: 'cancelled', cancellationReason: reason },
    });
  }

  return success;
};

export const deleteWorkOrder = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingMWO = await maintenanceWorkOrderRepository.findById(id);
  if (!existingMWO) {
    throw new Error('Maintenance work order not found');
  }

  if (existingMWO.status !== 'pending') {
    throw new Error('Only pending work orders can be deleted');
  }

  const success = await maintenanceWorkOrderRepository.deleteWorkOrder(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE_MAINTENANCE_WORK_ORDER',
      module: 'MAINTENANCE',
      recordType: 'maintenance_work_order',
      recordId: id,
      oldValues: {
        mwoNumber: existingMWO.mwoNumber,
        machineId: existingMWO.machineId,
      },
    });
  }

  return success;
};

export const createWorkOrderFromDowntime = async (
  downtimeId: number,
  data: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    estimatedDurationHours?: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const downtime = await downtimeRepository.findById(downtimeId);
  if (!downtime) {
    throw new Error('Production downtime not found');
  }

  if (downtime.category !== 'breakdown') {
    throw new Error('Only breakdown downtime can generate corrective maintenance work orders');
  }

  const existingMWO = await maintenanceWorkOrderRepository.findByDowntime(downtimeId);
  if (existingMWO) {
    throw new Error('A maintenance work order already exists for this downtime');
  }

  if (!downtime.machineId) {
    throw new Error('Downtime must have an associated machine');
  }

  return await createWorkOrder(
    {
      machineId: downtime.machineId,
      productionDowntimeId: downtimeId,
      maintenanceType: 'corrective',
      priority: data.priority || 'high',
      problemDescription: downtime.reason,
      estimatedDurationHours: data.estimatedDurationHours,
      notes: data.notes,
    },
    createdBy
  );
};
