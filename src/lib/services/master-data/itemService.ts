import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { Item } from '@/lib/types/master-data';
import { PaginatedResponse } from '@/lib/types/common';

export const getItemById = async (id: number): Promise<Item | null> => {
  return await itemRepository.findById(id);
};

export const getItemByCode = async (itemCode: string): Promise<Item | null> => {
  return await itemRepository.findByCode(itemCode);
};

export const getAllItems = async (filters?: {
  isActive?: boolean;
  itemType?: string;
}): Promise<Item[]> => {
  return await itemRepository.findAll(filters);
};

export const getItemsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    isActive?: boolean;
    itemType?: string;
  }
): Promise<PaginatedResponse<Item>> => {
  const { data, total } = await itemRepository.findPaginated(page, pageSize, filters);
  
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

export const createItem = async (
  data: {
    itemCode: string;
    itemName: string;
    description?: string;
    itemType: 'raw_material' | 'component' | 'finished_good' | 'consumable';
    uomId: number;
    reorderLevel?: number;
    reorderQuantity?: number;
    unitCost?: number;
  },
  createdBy?: number
): Promise<number> => {
  const existingItem = await itemRepository.findByCode(data.itemCode);
  if (existingItem) {
    throw new Error(`Item code '${data.itemCode}' already exists`);
  }

  if (!data.itemCode || data.itemCode.trim() === '') {
    throw new Error('Item code is required');
  }

  if (!data.itemName || data.itemName.trim() === '') {
    throw new Error('Item name is required');
  }

  if (!data.itemType) {
    throw new Error('Item type is required');
  }

  if (!data.uomId) {
    throw new Error('Unit of measure is required');
  }

  const itemId = await itemRepository.create({
    itemCode: data.itemCode.trim().toUpperCase(),
    itemName: data.itemName.trim(),
    description: data.description?.trim(),
    itemType: data.itemType,
    uomId: data.uomId,
    reorderLevel: data.reorderLevel,
    reorderQuantity: data.reorderQuantity,
    unitCost: data.unitCost,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'MASTER_DATA',
    recordType: 'item',
    recordId: itemId,
    newValues: {
      itemCode: data.itemCode,
      itemName: data.itemName,
      itemType: data.itemType,
      uomId: data.uomId,
    },
  });

  return itemId;
};

export const updateItem = async (
  id: number,
  data: {
    itemName?: string;
    description?: string;
    itemType?: 'raw_material' | 'component' | 'finished_good' | 'consumable';
    uomId?: number;
    reorderLevel?: number;
    reorderQuantity?: number;
    unitCost?: number;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingItem = await itemRepository.findById(id);
  if (!existingItem) {
    throw new Error('Item not found');
  }

  if (data.itemName !== undefined && data.itemName.trim() === '') {
    throw new Error('Item name cannot be empty');
  }

  const success = await itemRepository.update(id, {
    itemName: data.itemName?.trim(),
    description: data.description?.trim(),
    itemType: data.itemType,
    uomId: data.uomId,
    reorderLevel: data.reorderLevel,
    reorderQuantity: data.reorderQuantity,
    unitCost: data.unitCost,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MASTER_DATA',
      recordType: 'item',
      recordId: id,
      oldValues: {
        itemName: existingItem.itemName,
        itemType: existingItem.itemType,
        uomId: existingItem.uomId,
        unitCost: existingItem.unitCost,
      },
      newValues: data,
    });
  }

  return success;
};

export const deactivateItem = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const existingItem = await itemRepository.findById(id);
  if (!existingItem) {
    throw new Error('Item not found');
  }

  if (!existingItem.isActive) {
    throw new Error('Item is already inactive');
  }

  const success = await itemRepository.deactivate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'DEACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'item',
      recordId: id,
    });
  }

  return success;
};

export const activateItem = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const existingItem = await itemRepository.findById(id);
  if (!existingItem) {
    throw new Error('Item not found');
  }

  if (existingItem.isActive) {
    throw new Error('Item is already active');
  }

  const success = await itemRepository.activate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'ACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'item',
      recordId: id,
    });
  }

  return success;
};

export const deleteItem = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingItem = await itemRepository.findById(id);
  if (!existingItem) {
    throw new Error('Item not found');
  }

  const success = await itemRepository.deleteItem(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'MASTER_DATA',
      recordType: 'item',
      recordId: id,
      oldValues: {
        itemCode: existingItem.itemCode,
        itemName: existingItem.itemName,
      },
    });
  }

  return success;
};
