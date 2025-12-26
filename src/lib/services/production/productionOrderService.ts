import * as productionOrderRepository from '@/lib/repositories/production/productionOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import { ProductionOrder } from '@/lib/types/production';
import { PaginatedResponse } from '@/lib/types/common';

export const getProductionOrderById = async (id: number): Promise<ProductionOrder | null> => {
  return await productionOrderRepository.findById(id);
};

export const getProductionOrderByPoNumber = async (poNumber: string): Promise<ProductionOrder | null> => {
  return await productionOrderRepository.findByPoNumber(poNumber);
};

export const getAllProductionOrders = async (filters?: {
  status?: string;
  priority?: string;
  itemId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<ProductionOrder[]> => {
  return await productionOrderRepository.findAll(filters);
};

export const getProductionOrdersPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    priority?: string;
    itemId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<ProductionOrder>> => {
  const { data, total } = await productionOrderRepository.findPaginated(page, pageSize, filters);
  
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

export const createProductionOrder = async (
  data: {
    poNumber: string;
    customerPoReference?: string;
    itemId: number;
    quantityOrdered: number;
    requiredDate: Date;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
    submitForApproval?: boolean;
  },
  createdBy?: number
): Promise<number> => {
  const existingPO = await productionOrderRepository.findByPoNumber(data.poNumber);
  if (existingPO) {
    throw new Error(`Production order number '${data.poNumber}' already exists`);
  }

  if (!data.poNumber || data.poNumber.trim() === '') {
    throw new Error('Production order number is required');
  }

  if (!data.itemId) {
    throw new Error('Item is required');
  }

  const item = await itemRepository.findById(data.itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  if (item.itemType !== 'finished_good') {
    throw new Error('Production orders can only be created for finished goods');
  }

  if (!data.quantityOrdered || data.quantityOrdered <= 0) {
    throw new Error('Quantity ordered must be greater than 0');
  }

  if (!data.requiredDate) {
    throw new Error('Required date is required');
  }

  const requiredDate = new Date(data.requiredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (requiredDate < today) {
    throw new Error('Required date cannot be in the past');
  }

  const status = data.submitForApproval ? 'pending_approval' : 'draft';

  const poId = await productionOrderRepository.create({
    poNumber: data.poNumber.trim().toUpperCase(),
    customerPoReference: data.customerPoReference?.trim(),
    itemId: data.itemId,
    quantityOrdered: data.quantityOrdered,
    requiredDate: data.requiredDate,
    priority: data.priority || 'normal',
    status,
    notes: data.notes?.trim(),
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'PRODUCTION',
    recordType: 'production_order',
    recordId: poId,
    newValues: {
      poNumber: data.poNumber,
      itemId: data.itemId,
      quantityOrdered: data.quantityOrdered,
      requiredDate: data.requiredDate,
      priority: data.priority,
      status,
    },
  });

  return poId;
};

export const updateProductionOrder = async (
  id: number,
  data: {
    customerPoReference?: string;
    itemId?: number;
    quantityOrdered?: number;
    requiredDate?: Date;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status !== 'draft') {
    throw new Error('Only draft production orders can be updated');
  }

  if (data.itemId !== undefined) {
    const item = await itemRepository.findById(data.itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    if (item.itemType !== 'finished_good') {
      throw new Error('Production orders can only be created for finished goods');
    }
  }

  if (data.quantityOrdered !== undefined && data.quantityOrdered <= 0) {
    throw new Error('Quantity ordered must be greater than 0');
  }

  if (data.requiredDate !== undefined) {
    const requiredDate = new Date(data.requiredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requiredDate < today) {
      throw new Error('Required date cannot be in the past');
    }
  }

  const success = await productionOrderRepository.update(id, {
    customerPoReference: data.customerPoReference?.trim(),
    itemId: data.itemId,
    quantityOrdered: data.quantityOrdered,
    requiredDate: data.requiredDate,
    priority: data.priority,
    notes: data.notes?.trim(),
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: {
        itemId: existingPO.itemId,
        quantityOrdered: existingPO.quantityOrdered,
        requiredDate: existingPO.requiredDate,
        priority: existingPO.priority,
      },
      newValues: data,
    });
  }

  return success;
};

export const submitForApproval = async (
  id: number,
  submittedBy?: number
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status !== 'draft') {
    throw new Error('Only draft production orders can be submitted for approval');
  }

  const success = await productionOrderRepository.update(id, {
    status: 'pending_approval',
    updatedBy: submittedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: submittedBy,
      action: 'SUBMIT_FOR_APPROVAL',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: { status: 'draft' },
      newValues: { status: 'pending_approval' },
    });
  }

  return success;
};

export const approveProductionOrder = async (
  id: number,
  approvedBy: number
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status !== 'pending_approval') {
    throw new Error('Only pending production orders can be approved');
  }

  const success = await productionOrderRepository.approve(id, approvedBy);

  if (success) {
    await auditLogRepository.create({
      userId: approvedBy,
      action: 'APPROVE',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: { status: 'pending_approval' },
      newValues: { status: 'approved', approvedBy },
    });
  }

  return success;
};

export const rejectProductionOrder = async (
  id: number,
  rejectedBy: number,
  reason?: string
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status !== 'pending_approval') {
    throw new Error('Only pending production orders can be rejected');
  }

  const success = await productionOrderRepository.update(id, {
    status: 'draft',
    notes: reason ? `${existingPO.notes || ''}\n[REJECTED: ${reason}]` : existingPO.notes,
    updatedBy: rejectedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: rejectedBy,
      action: 'REJECT',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: { status: 'pending_approval' },
      newValues: { status: 'draft', rejectionReason: reason },
    });
  }

  return success;
};

export const releaseProductionOrder = async (
  id: number,
  releasedBy: number
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status !== 'approved') {
    throw new Error('Only approved production orders can be released');
  }

  const success = await productionOrderRepository.release(id, releasedBy);

  if (success) {
    await auditLogRepository.create({
      userId: releasedBy,
      action: 'RELEASE',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: { status: 'approved' },
      newValues: { status: 'released', releasedBy },
    });
  }

  return success;
};

export const cancelProductionOrder = async (
  id: number,
  cancelledBy: number,
  reason?: string
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status === 'completed' || existingPO.status === 'cancelled') {
    throw new Error('Completed or cancelled production orders cannot be cancelled');
  }

  const success = await productionOrderRepository.cancel(id, cancelledBy);

  if (success) {
    await auditLogRepository.create({
      userId: cancelledBy,
      action: 'CANCEL',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: { status: existingPO.status },
      newValues: { status: 'cancelled', cancellationReason: reason },
    });
  }

  return success;
};

export const deleteProductionOrder = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingPO = await productionOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Production order not found');
  }

  if (existingPO.status !== 'draft') {
    throw new Error('Only draft production orders can be deleted');
  }

  const success = await productionOrderRepository.deleteProductionOrder(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'PRODUCTION',
      recordType: 'production_order',
      recordId: id,
      oldValues: {
        poNumber: existingPO.poNumber,
        itemId: existingPO.itemId,
        quantityOrdered: existingPO.quantityOrdered,
      },
    });
  }

  return success;
};
