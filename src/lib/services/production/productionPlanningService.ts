import * as productionScheduleRepository from '@/lib/repositories/production/productionScheduleRepository';
import * as productionOrderRepository from '@/lib/repositories/production/productionOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { ProductionSchedule } from '@/lib/types/production';
import { PaginatedResponse } from '@/lib/types/common';

export const getScheduleById = async (id: number): Promise<ProductionSchedule | null> => {
  return await productionScheduleRepository.findById(id);
};

export const getSchedulesByProductionOrder = async (productionOrderId: number): Promise<ProductionSchedule[]> => {
  return await productionScheduleRepository.findByProductionOrder(productionOrderId);
};

export const getAllSchedules = async (filters?: {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  machineId?: number;
}): Promise<ProductionSchedule[]> => {
  return await productionScheduleRepository.findAll(filters);
};

export const getSchedulesPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    machineId?: number;
  }
): Promise<PaginatedResponse<ProductionSchedule>> => {
  const { data, total } = await productionScheduleRepository.findPaginated(page, pageSize, filters);
  
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

export const createSchedule = async (
  data: {
    productionOrderId: number;
    scheduledDate: Date;
    scheduledQuantity: number;
    machineId?: number;
    shiftId?: number;
  },
  createdBy?: number
): Promise<number> => {
  const productionOrder = await productionOrderRepository.findById(data.productionOrderId);
  if (!productionOrder) {
    throw new Error('Production order not found');
  }

  if (productionOrder.status !== 'released') {
    throw new Error('Only released production orders can be scheduled');
  }

  if (!data.scheduledDate) {
    throw new Error('Scheduled date is required');
  }

  if (!data.scheduledQuantity || data.scheduledQuantity <= 0) {
    throw new Error('Scheduled quantity must be greater than 0');
  }

  const existingSchedules = await productionScheduleRepository.findByProductionOrder(data.productionOrderId);
  const totalScheduled = existingSchedules.reduce((sum, s) => sum + s.scheduledQuantity, 0);
  const remainingQuantity = productionOrder.quantityOrdered - productionOrder.quantityProduced - totalScheduled;

  if (data.scheduledQuantity > remainingQuantity) {
    throw new Error(`Scheduled quantity exceeds remaining quantity (${remainingQuantity})`);
  }

  const scheduledDate = new Date(data.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (scheduledDate < today) {
    throw new Error('Scheduled date cannot be in the past');
  }

  const scheduleId = await productionScheduleRepository.create({
    productionOrderId: data.productionOrderId,
    scheduledDate: data.scheduledDate,
    scheduledQuantity: data.scheduledQuantity,
    machineId: data.machineId,
    shiftId: data.shiftId,
    status: 'scheduled',
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'PRODUCTION_PLANNING',
    recordType: 'production_schedule',
    recordId: scheduleId,
    newValues: {
      productionOrderId: data.productionOrderId,
      scheduledDate: data.scheduledDate,
      scheduledQuantity: data.scheduledQuantity,
      machineId: data.machineId,
      shiftId: data.shiftId,
    },
  });

  return scheduleId;
};

export const updateSchedule = async (
  id: number,
  data: {
    scheduledDate?: Date;
    scheduledQuantity?: number;
    machineId?: number;
    shiftId?: number;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingSchedule = await productionScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Production schedule not found');
  }

  if (existingSchedule.status !== 'scheduled') {
    throw new Error('Only scheduled production schedules can be updated');
  }

  if (data.scheduledQuantity !== undefined && data.scheduledQuantity <= 0) {
    throw new Error('Scheduled quantity must be greater than 0');
  }

  if (data.scheduledDate !== undefined) {
    const scheduledDate = new Date(data.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduledDate < today) {
      throw new Error('Scheduled date cannot be in the past');
    }
  }

  const success = await productionScheduleRepository.update(id, {
    scheduledDate: data.scheduledDate,
    scheduledQuantity: data.scheduledQuantity,
    machineId: data.machineId,
    shiftId: data.shiftId,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'PRODUCTION_PLANNING',
      recordType: 'production_schedule',
      recordId: id,
      oldValues: {
        scheduledDate: existingSchedule.scheduledDate,
        scheduledQuantity: existingSchedule.scheduledQuantity,
        machineId: existingSchedule.machineId,
        shiftId: existingSchedule.shiftId,
      },
      newValues: data,
    });
  }

  return success;
};

export const cancelSchedule = async (
  id: number,
  cancelledBy?: number
): Promise<boolean> => {
  const existingSchedule = await productionScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Production schedule not found');
  }

  if (existingSchedule.status === 'completed') {
    throw new Error('Completed schedules cannot be cancelled');
  }

  if (existingSchedule.status === 'cancelled') {
    throw new Error('Schedule is already cancelled');
  }

  const success = await productionScheduleRepository.update(id, {
    status: 'cancelled',
    updatedBy: cancelledBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: cancelledBy,
      action: 'CANCEL',
      module: 'PRODUCTION_PLANNING',
      recordType: 'production_schedule',
      recordId: id,
      oldValues: { status: existingSchedule.status },
      newValues: { status: 'cancelled' },
    });
  }

  return success;
};

export const deleteSchedule = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingSchedule = await productionScheduleRepository.findById(id);
  if (!existingSchedule) {
    throw new Error('Production schedule not found');
  }

  if (existingSchedule.status !== 'scheduled') {
    throw new Error('Only scheduled production schedules can be deleted');
  }

  const success = await productionScheduleRepository.deleteSchedule(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'PRODUCTION_PLANNING',
      recordType: 'production_schedule',
      recordId: id,
      oldValues: {
        productionOrderId: existingSchedule.productionOrderId,
        scheduledDate: existingSchedule.scheduledDate,
        scheduledQuantity: existingSchedule.scheduledQuantity,
      },
    });
  }

  return success;
};

export const autoScheduleProductionOrder = async (
  productionOrderId: number,
  schedulingStrategy: 'daily' | 'weekly' = 'daily',
  createdBy?: number
): Promise<number[]> => {
  const productionOrder = await productionOrderRepository.findById(productionOrderId);
  if (!productionOrder) {
    throw new Error('Production order not found');
  }

  if (productionOrder.status !== 'released') {
    throw new Error('Only released production orders can be scheduled');
  }

  const existingSchedules = await productionScheduleRepository.findByProductionOrder(productionOrderId);
  if (existingSchedules.length > 0) {
    throw new Error('Production order already has schedules');
  }

  const remainingQuantity = productionOrder.quantityOrdered - productionOrder.quantityProduced;
  if (remainingQuantity <= 0) {
    throw new Error('No remaining quantity to schedule');
  }

  const scheduleIds: number[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const requiredDate = new Date(productionOrder.requiredDate);
  const daysUntilRequired = Math.ceil((requiredDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilRequired <= 0) {
    throw new Error('Required date is in the past or today');
  }

  if (schedulingStrategy === 'daily') {
    const dailyQuantity = Math.ceil(remainingQuantity / daysUntilRequired);
    let scheduledTotal = 0;

    for (let i = 0; i < daysUntilRequired && scheduledTotal < remainingQuantity; i++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(scheduleDate.getDate() + i + 1);

      const quantityToSchedule = Math.min(dailyQuantity, remainingQuantity - scheduledTotal);

      const scheduleId = await createSchedule(
        {
          productionOrderId,
          scheduledDate: scheduleDate,
          scheduledQuantity: quantityToSchedule,
        },
        createdBy
      );

      scheduleIds.push(scheduleId);
      scheduledTotal += quantityToSchedule;
    }
  } else if (schedulingStrategy === 'weekly') {
    const weeksUntilRequired = Math.ceil(daysUntilRequired / 7);
    const weeklyQuantity = Math.ceil(remainingQuantity / weeksUntilRequired);
    let scheduledTotal = 0;

    for (let i = 0; i < weeksUntilRequired && scheduledTotal < remainingQuantity; i++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(scheduleDate.getDate() + (i + 1) * 7);

      const quantityToSchedule = Math.min(weeklyQuantity, remainingQuantity - scheduledTotal);

      const scheduleId = await createSchedule(
        {
          productionOrderId,
          scheduledDate: scheduleDate,
          scheduledQuantity: quantityToSchedule,
        },
        createdBy
      );

      scheduleIds.push(scheduleId);
      scheduledTotal += quantityToSchedule;
    }
  }

  await auditLogRepository.create({
    userId: createdBy,
    action: 'AUTO_SCHEDULE',
    module: 'PRODUCTION_PLANNING',
    recordType: 'production_order',
    recordId: productionOrderId,
    newValues: {
      strategy: schedulingStrategy,
      schedulesCreated: scheduleIds.length,
      totalQuantity: remainingQuantity,
    },
  });

  return scheduleIds;
};
