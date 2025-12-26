import * as inventoryBalanceRepository from '@/lib/repositories/inventory/inventoryBalanceRepository';
import * as inventoryTransactionRepository from '@/lib/repositories/inventory/inventoryTransactionRepository';
import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { withTransaction } from '@/lib/database/transaction';
import { InventoryBalance } from '@/lib/types/inventory';
import { PaginatedResponse } from '@/lib/types/common';

export const getInventoryBalance = async (
  itemId: number,
  warehouseId: number
): Promise<InventoryBalance | null> => {
  return await inventoryBalanceRepository.findByItemAndWarehouse(itemId, warehouseId);
};

export const getInventoryBalancesByItem = async (itemId: number): Promise<InventoryBalance[]> => {
  return await inventoryBalanceRepository.findByItem(itemId);
};

export const getInventoryBalancesByWarehouse = async (warehouseId: number): Promise<InventoryBalance[]> => {
  return await inventoryBalanceRepository.findByWarehouse(warehouseId);
};

export const getAllInventoryBalances = async (filters?: {
  itemId?: number;
  warehouseId?: number;
}): Promise<InventoryBalance[]> => {
  return await inventoryBalanceRepository.findAll(filters);
};

export const getInventoryBalancesPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    itemId?: number;
    warehouseId?: number;
  }
): Promise<PaginatedResponse<InventoryBalance>> => {
  const { data, total } = await inventoryBalanceRepository.findPaginated(page, pageSize, filters);
  
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

export const getTotalQuantity = async (
  itemId: number,
  warehouseId?: number
): Promise<{
  available: number;
  reserved: number;
  underInspection: number;
  rejected: number;
  total: number;
}> => {
  return await inventoryBalanceRepository.getTotalQuantity(itemId, warehouseId);
};

export const adjustInventory = async (
  data: {
    itemId: number;
    warehouseId: number;
    adjustmentType: 'available' | 'reserved' | 'under_inspection' | 'rejected';
    quantity: number;
    reason: string;
    notes?: string;
  },
  adjustedBy?: number
): Promise<boolean> => {
  return await withTransaction(async (connection) => {
    const item = await itemRepository.findById(data.itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (!data.reason || data.reason.trim() === '') {
      throw new Error('Adjustment reason is required');
    }

    if (data.quantity === 0) {
      throw new Error('Adjustment quantity cannot be zero');
    }

    await inventoryBalanceRepository.createOrUpdate({
      itemId: data.itemId,
      warehouseId: data.warehouseId,
    });

    const fieldMap = {
      available: 'quantityAvailable',
      reserved: 'quantityReserved',
      under_inspection: 'quantityInspection',
      rejected: 'quantityRejected',
    };

    const field = fieldMap[data.adjustmentType] as 'quantityAvailable' | 'quantityReserved' | 'quantityInspection' | 'quantityRejected';

    const currentBalance = await inventoryBalanceRepository.findByItemAndWarehouse(
      data.itemId,
      data.warehouseId
    );

    if (currentBalance) {
      const currentQty = currentBalance[field];
      if (currentQty + data.quantity < 0) {
        throw new Error(`Adjustment would result in negative inventory. Current: ${currentQty}, Adjustment: ${data.quantity}`);
      }
    } else if (data.quantity < 0) {
      throw new Error('Cannot adjust negative quantity on non-existent inventory');
    }

    const success = await inventoryBalanceRepository.adjustQuantity(
      data.itemId,
      data.warehouseId,
      field,
      data.quantity
    );

    if (success) {
      await inventoryTransactionRepository.create({
        transactionDate: new Date(),
        transactionType: 'adjustment',
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        statusTo: data.adjustmentType as 'available' | 'reserved' | 'under_inspection' | 'rejected',
        referenceType: 'manual_adjustment',
        notes: `${data.reason}${data.notes ? ` - ${data.notes}` : ''}`,
        createdBy: adjustedBy,
      });

      await auditLogRepository.create({
        userId: adjustedBy,
        action: 'INVENTORY_ADJUSTMENT',
        module: 'INVENTORY',
        recordType: 'inventory_balance',
        recordId: currentBalance?.id,
        newValues: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          adjustmentType: data.adjustmentType,
          quantity: data.quantity,
          reason: data.reason,
        },
      });
    }

    return success;
  });
};

export const transferInventoryStatus = async (
  data: {
    itemId: number;
    warehouseId: number;
    fromStatus: 'available' | 'reserved' | 'under_inspection' | 'rejected';
    toStatus: 'available' | 'reserved' | 'under_inspection' | 'rejected';
    quantity: number;
    reason: string;
    notes?: string;
  },
  transferredBy?: number
): Promise<boolean> => {
  return await withTransaction(async (connection) => {
    if (data.fromStatus === data.toStatus) {
      throw new Error('From and To status must be different');
    }

    if (data.quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0');
    }

    if (!data.reason || data.reason.trim() === '') {
      throw new Error('Transfer reason is required');
    }

    const balance = await inventoryBalanceRepository.findByItemAndWarehouse(
      data.itemId,
      data.warehouseId
    );

    if (!balance) {
      throw new Error('No inventory balance found for this item and warehouse');
    }

    const fieldMap = {
      available: 'quantityAvailable',
      reserved: 'quantityReserved',
      under_inspection: 'quantityInspection',
      rejected: 'quantityRejected',
    };

    const fromField = fieldMap[data.fromStatus] as keyof InventoryBalance;
    const currentQty = balance[fromField] as number;

    if (currentQty < data.quantity) {
      throw new Error(`Insufficient quantity in ${data.fromStatus} status. Available: ${currentQty}, Requested: ${data.quantity}`);
    }

    await inventoryBalanceRepository.adjustQuantity(
      data.itemId,
      data.warehouseId,
      fromField as 'quantityAvailable' | 'quantityReserved' | 'quantityInspection' | 'quantityRejected',
      -data.quantity
    );

    await inventoryBalanceRepository.adjustQuantity(
      data.itemId,
      data.warehouseId,
      fieldMap[data.toStatus] as 'quantityAvailable' | 'quantityReserved' | 'quantityInspection' | 'quantityRejected',
      data.quantity
    );

    await inventoryTransactionRepository.create({
      transactionDate: new Date(),
      transactionType: 'adjustment',
      itemId: data.itemId,
      warehouseId: data.warehouseId,
      quantity: data.quantity,
      statusFrom: data.fromStatus,
      statusTo: data.toStatus,
      referenceType: 'status_transfer',
      notes: `${data.reason}${data.notes ? ` - ${data.notes}` : ''}`,
      createdBy: transferredBy,
    });

    await auditLogRepository.create({
      userId: transferredBy,
      action: 'INVENTORY_STATUS_TRANSFER',
      module: 'INVENTORY',
      recordType: 'inventory_balance',
      recordId: balance.id,
      newValues: {
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        quantity: data.quantity,
        reason: data.reason,
      },
    });

    return true;
  });
};
