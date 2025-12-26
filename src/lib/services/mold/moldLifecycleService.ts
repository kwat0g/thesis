import * as moldRepository from '@/lib/repositories/master-data/moldRepository';
import * as moldConditionHistoryRepository from '@/lib/repositories/mold/moldConditionHistoryRepository';
import * as moldUsageRepository from '@/lib/repositories/mold/moldUsageRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { Mold } from '@/lib/types/master-data';

export const getMoldById = async (id: number): Promise<Mold | null> => {
  return await moldRepository.findById(id);
};

export const getMoldByCode = async (moldCode: string): Promise<Mold | null> => {
  return await moldRepository.findByCode(moldCode);
};

export const checkMoldAvailability = async (moldId: number): Promise<{ available: boolean; reason?: string }> => {
  const mold = await moldRepository.findById(moldId);
  
  if (!mold) {
    return { available: false, reason: 'Mold not found' };
  }

  if (!mold.isActive) {
    return { available: false, reason: 'Mold is inactive' };
  }

  if (mold.status !== 'available') {
    return { available: false, reason: `Mold is currently ${mold.status}` };
  }

  if (mold.maxShots && mold.totalShots >= mold.maxShots) {
    return { available: false, reason: 'Mold has reached maximum shot count' };
  }

  return { available: true };
};

export const updateMoldStatus = async (
  moldId: number,
  newStatus: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired',
  reason?: string,
  conditionNotes?: string,
  updatedBy?: number
): Promise<boolean> => {
  const mold = await moldRepository.findById(moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  if (mold.status === newStatus) {
    throw new Error(`Mold is already in ${newStatus} status`);
  }

  const previousStatus = mold.status as 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';

  const success = await moldRepository.update(moldId, {
    status: newStatus,
    updatedBy,
  });

  if (success) {
    await moldConditionHistoryRepository.create({
      moldId,
      previousStatus,
      newStatus,
      changeDate: new Date(),
      reason,
      totalShotsAtChange: mold.totalShots,
      conditionNotes,
      changedBy: updatedBy,
    });

    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_MOLD_STATUS',
      module: 'MOLD_MANAGEMENT',
      recordType: 'mold',
      recordId: moldId,
      oldValues: { status: previousStatus },
      newValues: { status: newStatus, reason },
    });
  }

  return success;
};

export const setMoldInUse = async (
  moldId: number,
  updatedBy?: number
): Promise<boolean> => {
  const availability = await checkMoldAvailability(moldId);
  if (!availability.available) {
    throw new Error(availability.reason || 'Mold is not available');
  }

  return await updateMoldStatus(moldId, 'in_use', 'Assigned to work order', undefined, updatedBy);
};

export const setMoldAvailable = async (
  moldId: number,
  updatedBy?: number
): Promise<boolean> => {
  const mold = await moldRepository.findById(moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  if (mold.status === 'available') {
    throw new Error('Mold is already available');
  }

  const activeUsage = await moldUsageRepository.findActiveUsage(moldId);
  if (activeUsage) {
    throw new Error('Cannot set mold to available while it has active usage');
  }

  return await updateMoldStatus(moldId, 'available', 'Released from previous status', undefined, updatedBy);
};

export const setMoldUnderMaintenance = async (
  moldId: number,
  reason?: string,
  updatedBy?: number
): Promise<boolean> => {
  return await updateMoldStatus(moldId, 'maintenance', reason || 'Scheduled maintenance', undefined, updatedBy);
};

export const setMoldUnderRepair = async (
  moldId: number,
  reason?: string,
  updatedBy?: number
): Promise<boolean> => {
  return await updateMoldStatus(moldId, 'repair', reason || 'Requires repair', undefined, updatedBy);
};

export const retireMold = async (
  moldId: number,
  reason?: string,
  updatedBy?: number
): Promise<boolean> => {
  const mold = await moldRepository.findById(moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  const activeUsage = await moldUsageRepository.findActiveUsage(moldId);
  if (activeUsage) {
    throw new Error('Cannot retire mold while it has active usage');
  }

  const success = await updateMoldStatus(moldId, 'retired', reason || 'End of life', undefined, updatedBy);

  if (success) {
    await moldRepository.update(moldId, {
      isActive: false,
      updatedBy,
    });
  }

  return success;
};

export const updateMoldShotCount = async (
  moldId: number,
  additionalShots: number,
  updatedBy?: number
): Promise<boolean> => {
  const mold = await moldRepository.findById(moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  const newTotalShots = mold.totalShots + additionalShots;

  const success = await moldRepository.update(moldId, {
    totalShots: newTotalShots,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_MOLD_SHOTS',
      module: 'MOLD_MANAGEMENT',
      recordType: 'mold',
      recordId: moldId,
      oldValues: { totalShots: mold.totalShots },
      newValues: { totalShots: newTotalShots, additionalShots },
    });

    if (mold.maxShots && newTotalShots >= mold.maxShots) {
      await updateMoldStatus(
        moldId,
        'maintenance',
        `Maximum shot count reached (${newTotalShots}/${mold.maxShots})`,
        'Requires inspection or retirement evaluation',
        updatedBy
      );
    }
  }

  return success;
};

export const getMoldConditionHistory = async (moldId: number) => {
  return await moldConditionHistoryRepository.findByMold(moldId);
};

export const getMoldCurrentCondition = async (moldId: number) => {
  const mold = await moldRepository.findById(moldId);
  if (!mold) {
    throw new Error('Mold not found');
  }

  const latestHistory = await moldConditionHistoryRepository.findLatestByMold(moldId);
  const usageHistory = await moldUsageRepository.findByMold(moldId);
  const totalUsageRecords = usageHistory.length;
  const activeUsage = await moldUsageRepository.findActiveUsage(moldId);

  const shotUtilization = mold.maxShots ? (mold.totalShots / mold.maxShots) * 100 : null;

  return {
    mold,
    currentStatus: mold.status,
    totalShots: mold.totalShots,
    maxShots: mold.maxShots,
    shotUtilization,
    isActive: mold.isActive,
    hasActiveUsage: !!activeUsage,
    totalUsageRecords,
    latestStatusChange: latestHistory,
  };
};
