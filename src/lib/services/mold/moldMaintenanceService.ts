import * as moldMaintenanceRepository from '@/lib/repositories/mold/moldMaintenanceRepository';
import * as moldRepository from '@/lib/repositories/master-data/moldRepository';
import * as maintenanceWorkOrderRepository from '@/lib/repositories/maintenance/maintenanceWorkOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { MoldMaintenanceRecord } from '@/lib/types/mold';
import { PaginatedResponse } from '@/lib/types/common';

export const getMaintenanceById = async (id: number): Promise<MoldMaintenanceRecord | null> => {
  return await moldMaintenanceRepository.findById(id);
};

export const getMaintenanceByMold = async (moldId: number): Promise<MoldMaintenanceRecord[]> => {
  return await moldMaintenanceRepository.findByMold(moldId);
};

export const getAllMaintenance = async (filters?: {
  moldId?: number;
  maintenanceType?: string;
  status?: string;
  technicianId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<MoldMaintenanceRecord[]> => {
  return await moldMaintenanceRepository.findAll(filters);
};

export const getMaintenancePaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    moldId?: number;
    maintenanceType?: string;
    status?: string;
    technicianId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<MoldMaintenanceRecord>> => {
  const { data, total } = await moldMaintenanceRepository.findPaginated(page, pageSize, filters);
  
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

export const createMaintenanceRecord = async (
  data: {
    moldId: number;
    maintenanceWorkOrderId?: number;
    maintenanceType: 'preventive' | 'corrective' | 'inspection' | 'cleaning';
    maintenanceDate: Date;
    technicianId?: number;
    durationHours?: number;
    workPerformed: string;
    partsReplaced?: string;
    findings?: string;
    recommendations?: string;
    nextMaintenanceShots?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  },
  createdBy?: number
): Promise<number> => {
  const mold = await moldRepository.findById(data.moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  if (data.maintenanceWorkOrderId) {
    const mwo = await maintenanceWorkOrderRepository.findById(data.maintenanceWorkOrderId);
    if (!mwo) {
      throw new Error('Maintenance work order not found');
    }

    const existingRecord = await moldMaintenanceRepository.findByMaintenanceWorkOrder(data.maintenanceWorkOrderId);
    if (existingRecord) {
      throw new Error('Maintenance record already exists for this work order');
    }
  }

  const recordId = await moldMaintenanceRepository.create({
    moldId: data.moldId,
    maintenanceWorkOrderId: data.maintenanceWorkOrderId,
    maintenanceType: data.maintenanceType,
    maintenanceDate: data.maintenanceDate,
    technicianId: data.technicianId,
    durationHours: data.durationHours,
    workPerformed: data.workPerformed,
    partsReplaced: data.partsReplaced,
    findings: data.findings,
    recommendations: data.recommendations,
    shotsBeforeMaintenance: mold.totalShots,
    nextMaintenanceShots: data.nextMaintenanceShots,
    status: data.status,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_MOLD_MAINTENANCE_RECORD',
    module: 'MOLD_MANAGEMENT',
    recordType: 'mold_maintenance_record',
    recordId,
    newValues: {
      moldId: data.moldId,
      maintenanceType: data.maintenanceType,
      maintenanceWorkOrderId: data.maintenanceWorkOrderId,
    },
  });

  return recordId;
};

export const updateMaintenanceRecord = async (
  id: number,
  data: {
    maintenanceDate?: Date;
    technicianId?: number;
    durationHours?: number;
    workPerformed?: string;
    partsReplaced?: string;
    findings?: string;
    recommendations?: string;
    nextMaintenanceShots?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingRecord = await moldMaintenanceRepository.findById(id);
  if (!existingRecord) {
    throw new Error('Maintenance record not found');
  }

  const success = await moldMaintenanceRepository.update(id, {
    ...data,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_MOLD_MAINTENANCE_RECORD',
      module: 'MOLD_MANAGEMENT',
      recordType: 'mold_maintenance_record',
      recordId: id,
      oldValues: {
        status: existingRecord.status,
      },
      newValues: data,
    });
  }

  return success;
};

export const completeMaintenanceRecord = async (
  id: number,
  data: {
    durationHours: number;
    workPerformed: string;
    partsReplaced?: string;
    findings?: string;
    recommendations?: string;
    nextMaintenanceShots?: number;
  },
  completedBy?: number
): Promise<boolean> => {
  const record = await moldMaintenanceRepository.findById(id);
  if (!record) {
    throw new Error('Maintenance record not found');
  }

  if (record.status === 'completed') {
    throw new Error('Maintenance record already completed');
  }

  const success = await moldMaintenanceRepository.update(id, {
    ...data,
    status: 'completed',
    updatedBy: completedBy,
  });

  if (success) {
    const mold = await moldRepository.findById(record.moldId);
    if (mold && mold.status === 'maintenance') {
      await moldRepository.update(record.moldId, {
        status: 'available',
        updatedBy: completedBy,
      });
    }

    await auditLogRepository.create({
      userId: completedBy,
      action: 'COMPLETE_MOLD_MAINTENANCE',
      module: 'MOLD_MANAGEMENT',
      recordType: 'mold_maintenance_record',
      recordId: id,
      oldValues: { status: record.status },
      newValues: { status: 'completed', durationHours: data.durationHours },
    });
  }

  return success;
};

export const getMoldMaintenanceHistory = async (moldId: number) => {
  const records = await moldMaintenanceRepository.findByMold(moldId);
  const completedRecords = records.filter(r => r.status === 'completed');
  
  const totalMaintenances = completedRecords.length;
  const totalDuration = completedRecords.reduce((sum, r) => sum + r.durationHours, 0);
  const averageDuration = totalMaintenances > 0 ? totalDuration / totalMaintenances : 0;

  const maintenanceByType = {
    preventive: completedRecords.filter(r => r.maintenanceType === 'preventive').length,
    corrective: completedRecords.filter(r => r.maintenanceType === 'corrective').length,
    inspection: completedRecords.filter(r => r.maintenanceType === 'inspection').length,
    cleaning: completedRecords.filter(r => r.maintenanceType === 'cleaning').length,
  };

  const latestMaintenance = records.length > 0 ? records[0] : null;

  return {
    moldId,
    totalMaintenances,
    totalDurationHours: totalDuration,
    averageDurationHours: Math.round(averageDuration * 100) / 100,
    maintenanceByType,
    latestMaintenance,
    allRecords: records,
  };
};

export const createMaintenanceFromWorkOrder = async (
  maintenanceWorkOrderId: number,
  data: {
    durationHours: number;
    workPerformed: string;
    partsReplaced?: string;
    findings?: string;
    recommendations?: string;
    nextMaintenanceShots?: number;
  },
  createdBy?: number
): Promise<number> => {
  const mwo = await maintenanceWorkOrderRepository.findById(maintenanceWorkOrderId);
  if (!mwo) {
    throw new Error('Maintenance work order not found');
  }

  if (mwo.status !== 'completed') {
    throw new Error('Can only create maintenance record from completed work orders');
  }

  const existingRecord = await moldMaintenanceRepository.findByMaintenanceWorkOrder(maintenanceWorkOrderId);
  if (existingRecord) {
    throw new Error('Maintenance record already exists for this work order');
  }

  return await createMaintenanceRecord(
    {
      moldId: mwo.machineId,
      maintenanceWorkOrderId,
      maintenanceType: mwo.maintenanceType === 'preventive' ? 'preventive' : 'corrective',
      maintenanceDate: mwo.completedDate || new Date(),
      technicianId: mwo.assignedTechnicianId,
      durationHours: data.durationHours,
      workPerformed: data.workPerformed,
      partsReplaced: data.partsReplaced,
      findings: data.findings,
      recommendations: data.recommendations,
      nextMaintenanceShots: data.nextMaintenanceShots,
      status: 'completed',
    },
    createdBy
  );
};
