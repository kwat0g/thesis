import * as maintenanceScheduleRepository from '@/lib/repositories/maintenance/maintenanceScheduleRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { MaintenanceSchedule } from '@/lib/types/maintenance';
import { PaginatedResponse } from '@/lib/types/common';

export const getScheduleById = async (id: number): Promise<MaintenanceSchedule | null> => {
  return await maintenanceScheduleRepository.findById(id);
};

export const getScheduleByCode = async (scheduleCode: string): Promise<MaintenanceSchedule | null> => {
  return await maintenanceScheduleRepository.findByScheduleCode(scheduleCode);
};

export const getSchedulesByMachine = async (machineId: number): Promise<MaintenanceSchedule[]> => {
  return await maintenanceScheduleRepository.findByMachine(machineId);
};

export const getAllSchedules = async (filters?: {
  machineId?: number;
  maintenanceType?: string;
  isActive?: boolean;
  dueSoon?: boolean;
}): Promise<MaintenanceSchedule[]> => {
  return await maintenanceScheduleRepository.findAll(filters);
};

export const getSchedulesPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    machineId?: number;
    maintenanceType?: string;
    isActive?: boolean;
    dueSoon?: boolean;
  }
): Promise<PaginatedResponse<MaintenanceSchedule>> => {
  const { data, total } = await maintenanceScheduleRepository.findPaginated(page, pageSize, filters);
  
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

const generateScheduleCode = (machineId: number, maintenanceType: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const typePrefix = maintenanceType.substring(0, 3).toUpperCase();
  return `MS-${typePrefix}-${machineId}-${year}${month}`;
};

export const createSchedule = async (
  data: {
    machineId: number;
    maintenanceType: 'preventive' | 'predictive' | 'routine';
    frequencyDays: number;
    nextMaintenanceDate: Date;
    description?: string;
    estimatedDurationHours?: number;
    isActive?: boolean;
  },
  createdBy?: number
): Promise<number> => {
  if (data.frequencyDays <= 0) {
    throw new Error('Frequency days must be greater than 0');
  }

  const scheduleCode = generateScheduleCode(data.machineId, data.maintenanceType);

  const existingSchedule = await maintenanceScheduleRepository.findByScheduleCode(scheduleCode);
  if (existingSchedule) {
    throw new Error('A schedule with this code already exists');
  }

  const scheduleId = await maintenanceScheduleRepository.create({
    scheduleCode,
    machineId: data.machineId,
    maintenanceType: data.maintenanceType,
    frequencyDays: data.frequencyDays,
    nextMaintenanceDate: data.nextMaintenanceDate,
    description: data.description,
    estimatedDurationHours: data.estimatedDurationHours,
    isActive: data.isActive,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_MAINTENANCE_SCHEDULE',
    module: 'MAINTENANCE',
    recordType: 'maintenance_schedule',
    recordId: scheduleId,
    newValues: {
      scheduleCode,
      machineId: data.machineId,
      maintenanceType: data.maintenanceType,
      frequencyDays: data.frequencyDays,
    },
  });

  return scheduleId;
};

export const updateSchedule = async (
  id: number,
  data: {
    frequencyDays?: number;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    description?: string;
    estimatedDurationHours?: number;
    isActive?: boolean;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingSchedule = await maintenanceScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Maintenance schedule not found');
  }

  if (data.frequencyDays !== undefined && data.frequencyDays <= 0) {
    throw new Error('Frequency days must be greater than 0');
  }

  const success = await maintenanceScheduleRepository.update(id, {
    ...data,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      recordType: 'maintenance_schedule',
      recordId: id,
      oldValues: {
        frequencyDays: existingSchedule.frequencyDays,
        nextMaintenanceDate: existingSchedule.nextMaintenanceDate,
      },
      newValues: data,
    });
  }

  return success;
};

export const deactivateSchedule = async (
  id: number,
  deactivatedBy?: number
): Promise<boolean> => {
  const existingSchedule = await maintenanceScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Maintenance schedule not found');
  }

  if (!existingSchedule.isActive) {
    throw new Error('Schedule is already inactive');
  }

  const success = await maintenanceScheduleRepository.update(id, {
    isActive: false,
    updatedBy: deactivatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: deactivatedBy,
      action: 'DEACTIVATE_MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      recordType: 'maintenance_schedule',
      recordId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
    });
  }

  return success;
};

export const activateSchedule = async (
  id: number,
  activatedBy?: number
): Promise<boolean> => {
  const existingSchedule = await maintenanceScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Maintenance schedule not found');
  }

  if (existingSchedule.isActive) {
    throw new Error('Schedule is already active');
  }

  const success = await maintenanceScheduleRepository.update(id, {
    isActive: true,
    updatedBy: activatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: activatedBy,
      action: 'ACTIVATE_MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      recordType: 'maintenance_schedule',
      recordId: id,
      oldValues: { isActive: false },
      newValues: { isActive: true },
    });
  }

  return success;
};

export const deleteSchedule = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingSchedule = await maintenanceScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Maintenance schedule not found');
  }

  const success = await maintenanceScheduleRepository.deleteSchedule(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE_MAINTENANCE_SCHEDULE',
      module: 'MAINTENANCE',
      recordType: 'maintenance_schedule',
      recordId: id,
      oldValues: {
        scheduleCode: existingSchedule.scheduleCode,
        machineId: existingSchedule.machineId,
      },
    });
  }

  return success;
};

export const getOverdueSchedules = async (): Promise<MaintenanceSchedule[]> => {
  return await maintenanceScheduleRepository.findOverdueSchedules();
};

export const updateScheduleAfterMaintenance = async (
  scheduleId: number,
  maintenanceDate: Date,
  updatedBy?: number
): Promise<boolean> => {
  const schedule = await maintenanceScheduleRepository.findById(scheduleId);
  if (!schedule) {
    throw new Error('Maintenance schedule not found');
  }

  const nextMaintenanceDate = new Date(maintenanceDate);
  nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + schedule.frequencyDays);

  return await maintenanceScheduleRepository.update(scheduleId, {
    lastMaintenanceDate: maintenanceDate,
    nextMaintenanceDate,
    updatedBy,
  });
};
