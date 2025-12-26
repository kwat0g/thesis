import * as goodsIssueRepository from '@/lib/repositories/inventory/goodsIssueRepository';
import * as inventoryBalanceRepository from '@/lib/repositories/inventory/inventoryBalanceRepository';
import * as inventoryTransactionRepository from '@/lib/repositories/inventory/inventoryTransactionRepository';
import * as productionOrderRepository from '@/lib/repositories/production/productionOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { withTransaction } from '@/lib/database/transaction';
import { GoodsIssue, GoodsIssueLine } from '@/lib/types/inventory';
import { PaginatedResponse } from '@/lib/types/common';

export const getGIById = async (id: number): Promise<GoodsIssue | null> => {
  return await goodsIssueRepository.findById(id);
};

export const getGIByNumber = async (giNumber: string): Promise<GoodsIssue | null> => {
  return await goodsIssueRepository.findByGINumber(giNumber);
};

export const getAllGIs = async (filters?: {
  status?: string;
  warehouseId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<GoodsIssue[]> => {
  return await goodsIssueRepository.findAll(filters);
};

export const getGIsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    warehouseId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<GoodsIssue>> => {
  const { data, total } = await goodsIssueRepository.findPaginated(page, pageSize, filters);
  
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

export const getGILines = async (giId: number): Promise<GoodsIssueLine[]> => {
  return await goodsIssueRepository.findLinesByGI(giId);
};

const generateGINumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `GI-${year}${month}${day}-${time}`;
};

export const createGoodsIssue = async (
  data: {
    productionOrderId: number;
    issueDate: Date;
    warehouseId: number;
    issuedBy: number;
    lines: Array<{
      itemId: number;
      quantityIssued: number;
      notes?: string;
    }>;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  return await withTransaction(async (connection) => {
    const productionOrder = await productionOrderRepository.findById(data.productionOrderId);
    if (!productionOrder) {
      throw new Error('Production order not found');
    }

    if (productionOrder.status !== 'released' && productionOrder.status !== 'in_progress') {
      throw new Error('Can only issue materials to released or in-progress production orders');
    }

    if (!data.lines || data.lines.length === 0) {
      throw new Error('Goods issue must have at least one line item');
    }

    for (const line of data.lines) {
      if (line.quantityIssued <= 0) {
        throw new Error('Quantity issued must be greater than 0');
      }

      const availableQty = await inventoryBalanceRepository.getAvailableQuantity(
        line.itemId,
        data.warehouseId
      );

      if (line.quantityIssued > availableQty) {
        throw new Error(`Insufficient inventory for item ${line.itemId}. Available: ${availableQty}, Requested: ${line.quantityIssued}`);
      }
    }

    const giNumber = generateGINumber();

    const giId = await goodsIssueRepository.create({
      giNumber,
      productionOrderId: data.productionOrderId,
      issueDate: data.issueDate,
      warehouseId: data.warehouseId,
      issuedBy: data.issuedBy,
      status: 'completed',
      notes: data.notes,
      createdBy,
    });

    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      
      await goodsIssueRepository.createLine({
        giId,
        lineNumber: i + 1,
        itemId: line.itemId,
        quantityIssued: line.quantityIssued,
        notes: line.notes,
      });

      await inventoryBalanceRepository.adjustQuantity(
        line.itemId,
        data.warehouseId,
        'quantityAvailable',
        -line.quantityIssued
      );

      await inventoryTransactionRepository.create({
        transactionDate: data.issueDate,
        transactionType: 'issue',
        itemId: line.itemId,
        warehouseId: data.warehouseId,
        quantity: -line.quantityIssued,
        statusFrom: 'available',
        referenceType: 'goods_issue',
        referenceId: giId,
        notes: `GI ${giNumber} - Issued to Production Order`,
        createdBy,
      });
    }

    await auditLogRepository.create({
      userId: createdBy,
      action: 'CREATE_GOODS_ISSUE',
      module: 'INVENTORY',
      recordType: 'goods_issue',
      recordId: giId,
      newValues: {
        giNumber,
        productionOrderId: data.productionOrderId,
        warehouseId: data.warehouseId,
        lineCount: data.lines.length,
      },
    });

    return giId;
  });
};

export const cancelGoodsIssue = async (
  id: number,
  cancelledBy?: number
): Promise<boolean> => {
  return await withTransaction(async (connection) => {
    const existingGI = await goodsIssueRepository.findById(id);
    if (!existingGI) {
      throw new Error('Goods issue not found');
    }

    if (existingGI.status === 'cancelled') {
      throw new Error('Goods issue is already cancelled');
    }

    const lines = await goodsIssueRepository.findLinesByGI(id);

    for (const line of lines) {
      await inventoryBalanceRepository.adjustQuantity(
        line.itemId,
        existingGI.warehouseId,
        'quantityAvailable',
        line.quantityIssued
      );

      await inventoryTransactionRepository.create({
        transactionDate: new Date(),
        transactionType: 'adjustment',
        itemId: line.itemId,
        warehouseId: existingGI.warehouseId,
        quantity: line.quantityIssued,
        statusTo: 'available',
        referenceType: 'goods_issue_cancellation',
        referenceId: id,
        notes: `Cancelled GI ${existingGI.giNumber}`,
        createdBy: cancelledBy,
      });
    }

    const success = await goodsIssueRepository.update(id, {
      status: 'cancelled',
      updatedBy: cancelledBy,
    });

    if (success) {
      await auditLogRepository.create({
        userId: cancelledBy,
        action: 'CANCEL_GOODS_ISSUE',
        module: 'INVENTORY',
        recordType: 'goods_issue',
        recordId: id,
        oldValues: { status: existingGI.status },
        newValues: { status: 'cancelled' },
      });
    }

    return success;
  });
};
