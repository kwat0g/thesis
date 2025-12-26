import * as downtimeRepository from '@/lib/repositories/production/downtimeRepository';
import * as workOrderRepository from '@/lib/repositories/production/workOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { ProductionDowntime } from '@/lib/types/production';

export const getDowntimeById = async (id: number): Promise<ProductionDowntime | null> => {
  return await downtimeRepository.findById(id);
};

export const getDowntimesByWorkOrder = async (workOrderId: number): Promise<ProductionDowntime[]> => {
  return await downtimeRepository.findByWorkOrder(workOrderId);
};

export const getAllDowntimes = async (filters?: {
  workOrderId?: number;
  machineId?: number;
  category?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<ProductionDowntime[]> => {
  return await downtimeRepository.findAll(filters);
};

export const logDowntime = async (
  data: {
    workOrderId: number;
    machineId?: number;
    downtimeStart: Date;
    downtimeEnd?: Date;
    reason: string;
    category: 'breakdown' | 'changeover' | 'material_shortage' | 'quality_issue' | 'other';
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const workOrder = await workOrderRepository.findById(data.workOrderId);
  if (!workOrder) {
    throw new Error('Work order not found');
  }

  if (!data.reason || data.reason.trim() === '') {
    throw new Error('Downtime reason is required');
  }

  let durationMinutes: number | undefined;
  if (data.downtimeEnd) {
    const start = new Date(data.downtimeStart).getTime();
    const end = new Date(data.downtimeEnd).getTime();
    
    if (end <= start) {
      throw new Error('Downtime end must be after downtime start');
    }

    durationMinutes = Math.round((end - start) / (1000 * 60));
  }

  const downtimeId = await downtimeRepository.create({
    workOrderId: data.workOrderId,
    machineId: data.machineId,
    downtimeStart: data.downtimeStart,
    downtimeEnd: data.downtimeEnd,
    durationMinutes,
    reason: data.reason,
    category: data.category,
    notes: data.notes,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'LOG_DOWNTIME',
    module: 'PRODUCTION_EXECUTION',
    recordType: 'production_downtime',
    recordId: downtimeId,
    newValues: {
      workOrderId: data.workOrderId,
      category: data.category,
      reason: data.reason,
      durationMinutes,
    },
  });

  return downtimeId;
};

export const endDowntime = async (
  id: number,
  downtimeEnd: Date,
  updatedBy?: number
): Promise<boolean> => {
  const existingDowntime = await downtimeRepository.findById(id);
  if (!existingDowntime) {
    throw new Error('Downtime record not found');
  }

  if (existingDowntime.downtimeEnd) {
    throw new Error('Downtime has already been ended');
  }

  const start = new Date(existingDowntime.downtimeStart).getTime();
  const end = new Date(downtimeEnd).getTime();

  if (end <= start) {
    throw new Error('Downtime end must be after downtime start');
  }

  const durationMinutes = Math.round((end - start) / (1000 * 60));

  const success = await downtimeRepository.update(id, {
    downtimeEnd,
    durationMinutes,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'END_DOWNTIME',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'production_downtime',
      recordId: id,
      oldValues: { downtimeEnd: null },
      newValues: { downtimeEnd, durationMinutes },
    });
  }

  return success;
};
