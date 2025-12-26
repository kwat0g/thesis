import * as goodsReceiptRepository from '@/lib/repositories/inventory/goodsReceiptRepository';
import * as inventoryBalanceRepository from '@/lib/repositories/inventory/inventoryBalanceRepository';
import * as inventoryTransactionRepository from '@/lib/repositories/inventory/inventoryTransactionRepository';
import * as purchaseOrderRepository from '@/lib/repositories/purchasing/purchaseOrderRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { withTransaction } from '@/lib/database/transaction';
import { GoodsReceipt, GoodsReceiptLine } from '@/lib/types/inventory';
import { PaginatedResponse } from '@/lib/types/common';

export const getGRById = async (id: number): Promise<GoodsReceipt | null> => {
  return await goodsReceiptRepository.findById(id);
};

export const getGRByNumber = async (grNumber: string): Promise<GoodsReceipt | null> => {
  return await goodsReceiptRepository.findByGRNumber(grNumber);
};

export const getAllGRs = async (filters?: {
  status?: string;
  warehouseId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<GoodsReceipt[]> => {
  return await goodsReceiptRepository.findAll(filters);
};

export const getGRsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    warehouseId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<GoodsReceipt>> => {
  const { data, total } = await goodsReceiptRepository.findPaginated(page, pageSize, filters);
  
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

export const getGRLines = async (grId: number): Promise<GoodsReceiptLine[]> => {
  return await goodsReceiptRepository.findLinesByGR(grId);
};

const generateGRNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `GR-${year}${month}${day}-${time}`;
};

export const createGoodsReceipt = async (
  data: {
    poId: number;
    receiptDate: Date;
    warehouseId: number;
    receiverId: number;
    lines: Array<{
      poLineId: number;
      itemId: number;
      quantityReceived: number;
      quantityAccepted: number;
      quantityRejected: number;
      notes?: string;
    }>;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  return await withTransaction(async (connection) => {
    const po = await purchaseOrderRepository.findById(data.poId);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status !== 'sent' && po.status !== 'approved') {
      throw new Error('Can only receive from approved or sent purchase orders');
    }

    if (!data.lines || data.lines.length === 0) {
      throw new Error('Goods receipt must have at least one line item');
    }

    const poLines = await purchaseOrderRepository.findLinesByPO(data.poId);

    for (const line of data.lines) {
      const poLine = poLines.find(pl => pl.id === line.poLineId);
      if (!poLine) {
        throw new Error(`PO line ${line.poLineId} not found`);
      }

      if (line.quantityReceived <= 0) {
        throw new Error('Quantity received must be greater than 0');
      }

      if (line.quantityAccepted < 0 || line.quantityRejected < 0) {
        throw new Error('Accepted and rejected quantities cannot be negative');
      }

      if (line.quantityAccepted + line.quantityRejected !== line.quantityReceived) {
        throw new Error('Accepted + Rejected must equal Received quantity');
      }

      const existingGRs = await goodsReceiptRepository.findByPO(data.poId);
      const allGRLines = await Promise.all(
        existingGRs.map(gr => goodsReceiptRepository.findLinesByGR(gr.id))
      );
      const totalReceived = allGRLines
        .flat()
        .filter(l => l.poLineId === line.poLineId)
        .reduce((sum, l) => sum + l.quantityReceived, 0);

      if (totalReceived + line.quantityReceived > poLine.quantity) {
        throw new Error(`Cannot over-receive. PO line quantity: ${poLine.quantity}, already received: ${totalReceived}`);
      }
    }

    const grNumber = generateGRNumber();

    const grId = await goodsReceiptRepository.create({
      grNumber,
      poId: data.poId,
      receiptDate: data.receiptDate,
      warehouseId: data.warehouseId,
      receiverId: data.receiverId,
      status: 'completed',
      notes: data.notes,
      createdBy,
    });

    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      
      await goodsReceiptRepository.createLine({
        grId,
        lineNumber: i + 1,
        poLineId: line.poLineId,
        itemId: line.itemId,
        quantityReceived: line.quantityReceived,
        quantityAccepted: line.quantityAccepted,
        quantityRejected: line.quantityRejected,
        notes: line.notes,
      });

      if (line.quantityAccepted > 0) {
        await inventoryBalanceRepository.createOrUpdate({
          itemId: line.itemId,
          warehouseId: data.warehouseId,
        });

        await inventoryBalanceRepository.adjustQuantity(
          line.itemId,
          data.warehouseId,
          'quantityAvailable',
          line.quantityAccepted
        );

        await inventoryTransactionRepository.create({
          transactionDate: data.receiptDate,
          transactionType: 'receipt',
          itemId: line.itemId,
          warehouseId: data.warehouseId,
          quantity: line.quantityAccepted,
          statusTo: 'available',
          referenceType: 'goods_receipt',
          referenceId: grId,
          notes: `GR ${grNumber} - Accepted`,
          createdBy,
        });
      }

      if (line.quantityRejected > 0) {
        await inventoryBalanceRepository.createOrUpdate({
          itemId: line.itemId,
          warehouseId: data.warehouseId,
        });

        await inventoryBalanceRepository.adjustQuantity(
          line.itemId,
          data.warehouseId,
          'quantityRejected',
          line.quantityRejected
        );

        await inventoryTransactionRepository.create({
          transactionDate: data.receiptDate,
          transactionType: 'receipt',
          itemId: line.itemId,
          warehouseId: data.warehouseId,
          quantity: line.quantityRejected,
          statusTo: 'rejected',
          referenceType: 'goods_receipt',
          referenceId: grId,
          notes: `GR ${grNumber} - Rejected`,
          createdBy,
        });
      }
    }

    await auditLogRepository.create({
      userId: createdBy,
      action: 'CREATE_GOODS_RECEIPT',
      module: 'INVENTORY',
      recordType: 'goods_receipt',
      recordId: grId,
      newValues: {
        grNumber,
        poId: data.poId,
        warehouseId: data.warehouseId,
        lineCount: data.lines.length,
      },
    });

    return grId;
  });
};

export const cancelGoodsReceipt = async (
  id: number,
  cancelledBy?: number
): Promise<boolean> => {
  return await withTransaction(async (connection) => {
    const existingGR = await goodsReceiptRepository.findById(id);
    if (!existingGR) {
      throw new Error('Goods receipt not found');
    }

    if (existingGR.status === 'cancelled') {
      throw new Error('Goods receipt is already cancelled');
    }

    const lines = await goodsReceiptRepository.findLinesByGR(id);

    for (const line of lines) {
      if (line.quantityAccepted > 0) {
        await inventoryBalanceRepository.adjustQuantity(
          line.itemId,
          existingGR.warehouseId,
          'quantityAvailable',
          -line.quantityAccepted
        );
      }

      if (line.quantityRejected > 0) {
        await inventoryBalanceRepository.adjustQuantity(
          line.itemId,
          existingGR.warehouseId,
          'quantityRejected',
          -line.quantityRejected
        );
      }

      await inventoryTransactionRepository.create({
        transactionDate: new Date(),
        transactionType: 'adjustment',
        itemId: line.itemId,
        warehouseId: existingGR.warehouseId,
        quantity: -line.quantityReceived,
        referenceType: 'goods_receipt_cancellation',
        referenceId: id,
        notes: `Cancelled GR ${existingGR.grNumber}`,
        createdBy: cancelledBy,
      });
    }

    const success = await goodsReceiptRepository.update(id, {
      status: 'cancelled',
      updatedBy: cancelledBy,
    });

    if (success) {
      await auditLogRepository.create({
        userId: cancelledBy,
        action: 'CANCEL_GOODS_RECEIPT',
        module: 'INVENTORY',
        recordType: 'goods_receipt',
        recordId: id,
        oldValues: { status: existingGR.status },
        newValues: { status: 'cancelled' },
      });
    }

    return success;
  });
};
