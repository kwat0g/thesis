import * as moldUsageRepository from '@/lib/repositories/mold/moldUsageRepository';
import * as moldRepository from '@/lib/repositories/master-data/moldRepository';
import * as workOrderRepository from '@/lib/repositories/production/workOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { MoldUsage } from '@/lib/types/mold';
import { PaginatedResponse } from '@/lib/types/common';

export const getUsageById = async (id: number): Promise<MoldUsage | null> => {
  return await moldUsageRepository.findById(id);
};

export const getUsageByMold = async (moldId: number): Promise<MoldUsage[]> => {
  return await moldUsageRepository.findByMold(moldId);
};

export const getUsageByWorkOrder = async (workOrderId: number): Promise<MoldUsage | null> => {
  return await moldUsageRepository.findByWorkOrder(workOrderId);
};

export const startMoldUsage = async (
  data: {
    moldId: number;
    workOrderId: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const mold = await moldRepository.findById(data.moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  if (!mold.isActive) {
    throw new Error('Cannot use inactive mold');
  }

  if (mold.status !== 'available') {
    throw new Error(`Mold is not available (current status: ${mold.status})`);
  }

  const workOrder = await workOrderRepository.findById(data.workOrderId);
  if (!workOrder) {
    throw new Error('Work order not found');
  }

  const existingUsage = await moldUsageRepository.findByWorkOrder(data.workOrderId);
  if (existingUsage) {
    throw new Error('Work order already has a mold assigned');
  }

  const activeUsage = await moldUsageRepository.findActiveUsage(data.moldId);
  if (activeUsage) {
    throw new Error('Mold is already in use by another work order');
  }

  if (mold.maxShots && mold.totalShots >= mold.maxShots) {
    throw new Error('Mold has reached maximum shot count and requires maintenance');
  }

  const usageId = await moldUsageRepository.create({
    moldId: data.moldId,
    workOrderId: data.workOrderId,
    usageStart: new Date(),
    notes: data.notes,
    createdBy,
  });

  await moldRepository.update(data.moldId, {
    status: 'in_use',
    updatedBy: createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'START_MOLD_USAGE',
    module: 'MOLD_MANAGEMENT',
    recordType: 'mold_usage',
    recordId: usageId,
    newValues: {
      moldId: data.moldId,
      workOrderId: data.workOrderId,
    },
  });

  return usageId;
};

export const endMoldUsage = async (
  usageId: number,
  data: {
    shotsProduced: number;
    notes?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const usage = await moldUsageRepository.findById(usageId);
  if (!usage) {
    throw new Error('Mold usage record not found');
  }

  if (usage.status === 'completed') {
    throw new Error('Mold usage already completed');
  }

  if (data.shotsProduced < 0) {
    throw new Error('Shots produced cannot be negative');
  }

  const success = await moldUsageRepository.update(usageId, {
    usageEnd: new Date(),
    shotsProduced: data.shotsProduced,
    status: 'completed',
    notes: data.notes,
  });

  if (success) {
    const mold = await moldRepository.findById(usage.moldId);
    if (mold) {
      const newTotalShots = mold.totalShots + data.shotsProduced;
      await moldRepository.update(usage.moldId, {
        totalShots: newTotalShots,
        status: 'available',
        updatedBy,
      });

      if (mold.maxShots && newTotalShots >= mold.maxShots) {
        await moldRepository.update(usage.moldId, {
          status: 'maintenance',
          updatedBy,
        });
      }
    }

    await auditLogRepository.create({
      userId: updatedBy,
      action: 'END_MOLD_USAGE',
      module: 'MOLD_MANAGEMENT',
      recordType: 'mold_usage',
      recordId: usageId,
      oldValues: { status: 'in_use' },
      newValues: { 
        status: 'completed',
        shotsProduced: data.shotsProduced,
      },
    });
  }

  return success;
};

export const getMoldUsageStatistics = async (moldId: number) => {
  const usageRecords = await moldUsageRepository.findByMold(moldId);
  const totalUsages = usageRecords.length;
  const completedUsages = usageRecords.filter(u => u.status === 'completed').length;
  const totalShots = await moldUsageRepository.getTotalShotsByMold(moldId);

  const averageShotsPerUsage = completedUsages > 0 ? totalShots / completedUsages : 0;

  return {
    moldId,
    totalUsages,
    completedUsages,
    activeUsages: totalUsages - completedUsages,
    totalShots,
    averageShotsPerUsage: Math.round(averageShotsPerUsage),
  };
};
