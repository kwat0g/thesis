import * as workOrderRepository from '@/lib/repositories/production/workOrderRepository';
import * as productionOrderRepository from '@/lib/repositories/production/productionOrderRepository';
import * as productionScheduleRepository from '@/lib/repositories/production/productionScheduleRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { WorkOrder } from '@/lib/types/production';
import { PaginatedResponse } from '@/lib/types/common';

export const getWorkOrderById = async (id: number): Promise<WorkOrder | null> => {
  return await workOrderRepository.findById(id);
};

export const getWorkOrderByNumber = async (woNumber: string): Promise<WorkOrder | null> => {
  return await workOrderRepository.findByWONumber(woNumber);
};

export const getAllWorkOrders = async (filters?: {
  status?: string;
  machineId?: number;
  supervisorId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<WorkOrder[]> => {
  return await workOrderRepository.findAll(filters);
};

export const getWorkOrdersPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    machineId?: number;
    supervisorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<WorkOrder>> => {
  const { data, total } = await workOrderRepository.findPaginated(page, pageSize, filters);
  
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

const generateWONumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `WO-${year}${month}${day}-${time}`;
};

export const createWorkOrder = async (
  data: {
    productionOrderId: number;
    productionScheduleId?: number;
    quantityPlanned: number;
    machineId?: number;
    moldId?: number;
    supervisorId?: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const productionOrder = await productionOrderRepository.findById(data.productionOrderId);
  if (!productionOrder) {
    throw new Error('Production order not found');
  }

  if (productionOrder.status !== 'released') {
    throw new Error('Can only create work orders from released production orders');
  }

  if (data.quantityPlanned <= 0) {
    throw new Error('Quantity planned must be greater than 0');
  }

  const remainingQty = productionOrder.quantityOrdered - productionOrder.quantityProduced;
  if (data.quantityPlanned > remainingQty) {
    throw new Error(`Quantity planned exceeds remaining quantity (${remainingQty})`);
  }

  const woNumber = generateWONumber();

  const woId = await workOrderRepository.create({
    woNumber,
    productionOrderId: data.productionOrderId,
    productionScheduleId: data.productionScheduleId,
    itemId: productionOrder.itemId,
    quantityPlanned: data.quantityPlanned,
    machineId: data.machineId,
    moldId: data.moldId,
    supervisorId: data.supervisorId,
    status: 'pending',
    notes: data.notes,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_WORK_ORDER',
    module: 'PRODUCTION_EXECUTION',
    recordType: 'work_order',
    recordId: woId,
    newValues: {
      woNumber,
      productionOrderId: data.productionOrderId,
      quantityPlanned: data.quantityPlanned,
    },
  });

  return woId;
};

export const releaseWorkOrder = async (
  id: number,
  releasedBy?: number
): Promise<boolean> => {
  const existingWO = await workOrderRepository.findById(id);
  if (!existingWO) {
    throw new Error('Work order not found');
  }

  if (existingWO.status !== 'pending') {
    throw new Error('Only pending work orders can be released');
  }

  const success = await workOrderRepository.update(id, {
    status: 'released',
    updatedBy: releasedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: releasedBy,
      action: 'RELEASE_WORK_ORDER',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'work_order',
      recordId: id,
      oldValues: { status: 'pending' },
      newValues: { status: 'released' },
    });
  }

  return success;
};

export const startWorkOrder = async (
  id: number,
  startedBy?: number
): Promise<boolean> => {
  const existingWO = await workOrderRepository.findById(id);
  if (!existingWO) {
    throw new Error('Work order not found');
  }

  if (existingWO.status !== 'released') {
    throw new Error('Only released work orders can be started');
  }

  const success = await workOrderRepository.update(id, {
    status: 'in_progress',
    startDate: new Date(),
    updatedBy: startedBy,
  });

  if (success) {
    await productionOrderRepository.update(existingWO.productionOrderId, {
      status: 'in_progress',
    });

    await auditLogRepository.create({
      userId: startedBy,
      action: 'START_WORK_ORDER',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'work_order',
      recordId: id,
      oldValues: { status: 'released' },
      newValues: { status: 'in_progress', startDate: new Date() },
    });
  }

  return success;
};

export const pauseWorkOrder = async (
  id: number,
  pausedBy?: number
): Promise<boolean> => {
  const existingWO = await workOrderRepository.findById(id);
  if (!existingWO) {
    throw new Error('Work order not found');
  }

  if (existingWO.status !== 'in_progress') {
    throw new Error('Only in-progress work orders can be paused');
  }

  const success = await workOrderRepository.update(id, {
    status: 'released',
    updatedBy: pausedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: pausedBy,
      action: 'PAUSE_WORK_ORDER',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'work_order',
      recordId: id,
      oldValues: { status: 'in_progress' },
      newValues: { status: 'released' },
    });
  }

  return success;
};

export const completeWorkOrder = async (
  id: number,
  completedBy?: number
): Promise<boolean> => {
  const existingWO = await workOrderRepository.findById(id);
  if (!existingWO) {
    throw new Error('Work order not found');
  }

  if (existingWO.status !== 'in_progress') {
    throw new Error('Only in-progress work orders can be completed');
  }

  const success = await workOrderRepository.update(id, {
    status: 'completed',
    endDate: new Date(),
    updatedBy: completedBy,
  });

  if (success) {
    const productionOrder = await productionOrderRepository.findById(existingWO.productionOrderId);
    if (productionOrder) {
      const totalProduced = productionOrder.quantityProduced + existingWO.quantityProduced;
      if (totalProduced >= productionOrder.quantityOrdered) {
        await productionOrderRepository.update(existingWO.productionOrderId, {
          status: 'completed',
        });
      }
    }

    await auditLogRepository.create({
      userId: completedBy,
      action: 'COMPLETE_WORK_ORDER',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'work_order',
      recordId: id,
      oldValues: { status: 'in_progress' },
      newValues: { status: 'completed', endDate: new Date() },
    });
  }

  return success;
};

export const cancelWorkOrder = async (
  id: number,
  cancelledBy?: number,
  reason?: string
): Promise<boolean> => {
  const existingWO = await workOrderRepository.findById(id);
  if (!existingWO) {
    throw new Error('Work order not found');
  }

  if (existingWO.status === 'completed' || existingWO.status === 'cancelled') {
    throw new Error('Cannot cancel completed or already cancelled work orders');
  }

  const success = await workOrderRepository.update(id, {
    status: 'cancelled',
    updatedBy: cancelledBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: cancelledBy,
      action: 'CANCEL_WORK_ORDER',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'work_order',
      recordId: id,
      oldValues: { status: existingWO.status },
      newValues: { status: 'cancelled', cancellationReason: reason },
    });
  }

  return success;
};

export const deleteWorkOrder = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingWO = await workOrderRepository.findById(id);
  if (!existingWO) {
    throw new Error('Work order not found');
  }

  if (existingWO.status !== 'pending') {
    throw new Error('Only pending work orders can be deleted');
  }

  const success = await workOrderRepository.deleteWorkOrder(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE_WORK_ORDER',
      module: 'PRODUCTION_EXECUTION',
      recordType: 'work_order',
      recordId: id,
      oldValues: {
        woNumber: existingWO.woNumber,
        productionOrderId: existingWO.productionOrderId,
      },
    });
  }

  return success;
};
