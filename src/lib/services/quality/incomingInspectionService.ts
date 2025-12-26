import * as inspectionRepository from '@/lib/repositories/quality/inspectionRepository';
import * as ncrRepository from '@/lib/repositories/quality/ncrRepository';
import * as goodsReceiptRepository from '@/lib/repositories/inventory/goodsReceiptRepository';
import * as inventoryBalanceRepository from '@/lib/repositories/inventory/inventoryBalanceRepository';
import * as inventoryTransactionRepository from '@/lib/repositories/inventory/inventoryTransactionRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { withTransaction } from '@/lib/database/transaction';
import { QCInspection, QCNCR } from '@/lib/types/quality';
import { PaginatedResponse } from '@/lib/types/common';

export const getInspectionById = async (id: number): Promise<QCInspection | null> => {
  return await inspectionRepository.findById(id);
};

export const getInspectionByNumber = async (inspectionNumber: string): Promise<QCInspection | null> => {
  return await inspectionRepository.findByInspectionNumber(inspectionNumber);
};

export const getAllInspections = async (filters?: {
  inspectionType?: string;
  status?: string;
  result?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<QCInspection[]> => {
  return await inspectionRepository.findAll(filters);
};

export const getInspectionsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    inspectionType?: string;
    status?: string;
    result?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<QCInspection>> => {
  const { data, total } = await inspectionRepository.findPaginated(page, pageSize, filters);
  
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

const generateInspectionNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `INS-${year}${month}${day}-${time}`;
};

export const createIncomingInspection = async (
  data: {
    goodsReceiptId: number;
    inspectionDate: Date;
    inspectorId: number;
    itemId: number;
    quantityInspected: number;
    quantityPassed: number;
    quantityFailed: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  return await withTransaction(async (connection) => {
    const gr = await goodsReceiptRepository.findById(data.goodsReceiptId);
    if (!gr) {
      throw new Error('Goods receipt not found');
    }

    if (gr.status !== 'completed') {
      throw new Error('Can only inspect completed goods receipts');
    }

    if (data.quantityInspected <= 0) {
      throw new Error('Quantity inspected must be greater than 0');
    }

    if (data.quantityPassed < 0 || data.quantityFailed < 0) {
      throw new Error('Passed and failed quantities cannot be negative');
    }

    if (data.quantityPassed + data.quantityFailed !== data.quantityInspected) {
      throw new Error('Passed + Failed must equal Inspected quantity');
    }

    const inspectionNumber = generateInspectionNumber();
    const result = data.quantityFailed === 0 ? 'pass' : (data.quantityPassed === 0 ? 'fail' : 'conditional_pass');

    const inspectionId = await inspectionRepository.create({
      inspectionNumber,
      inspectionType: 'incoming',
      inspectionDate: data.inspectionDate,
      inspectorId: data.inspectorId,
      referenceType: 'goods_receipt',
      referenceId: data.goodsReceiptId,
      itemId: data.itemId,
      quantityInspected: data.quantityInspected,
      quantityPassed: data.quantityPassed,
      quantityFailed: data.quantityFailed,
      status: 'completed',
      result,
      notes: data.notes,
      createdBy,
    });

    if (data.quantityPassed > 0) {
      await inventoryBalanceRepository.adjustQuantity(
        data.itemId,
        gr.warehouseId,
        'quantityInspection',
        -data.quantityPassed
      );

      await inventoryBalanceRepository.adjustQuantity(
        data.itemId,
        gr.warehouseId,
        'quantityAvailable',
        data.quantityPassed
      );

      await inventoryTransactionRepository.create({
        transactionDate: data.inspectionDate,
        transactionType: 'adjustment',
        itemId: data.itemId,
        warehouseId: gr.warehouseId,
        quantity: data.quantityPassed,
        statusFrom: 'under_inspection',
        statusTo: 'available',
        referenceType: 'inspection',
        referenceId: inspectionId,
        notes: `Inspection ${inspectionNumber} - Passed`,
        createdBy,
      });
    }

    if (data.quantityFailed > 0) {
      await inventoryBalanceRepository.adjustQuantity(
        data.itemId,
        gr.warehouseId,
        'quantityInspection',
        -data.quantityFailed
      );

      await inventoryBalanceRepository.adjustQuantity(
        data.itemId,
        gr.warehouseId,
        'quantityRejected',
        data.quantityFailed
      );

      await inventoryTransactionRepository.create({
        transactionDate: data.inspectionDate,
        transactionType: 'adjustment',
        itemId: data.itemId,
        warehouseId: gr.warehouseId,
        quantity: data.quantityFailed,
        statusFrom: 'under_inspection',
        statusTo: 'rejected',
        referenceType: 'inspection',
        referenceId: inspectionId,
        notes: `Inspection ${inspectionNumber} - Failed`,
        createdBy,
      });
    }

    await auditLogRepository.create({
      userId: createdBy,
      action: 'CREATE_INCOMING_INSPECTION',
      module: 'QUALITY',
      recordType: 'inspection_record',
      recordId: inspectionId,
      newValues: {
        inspectionNumber,
        goodsReceiptId: data.goodsReceiptId,
        itemId: data.itemId,
        quantityInspected: data.quantityInspected,
        quantityPassed: data.quantityPassed,
        quantityFailed: data.quantityFailed,
        result,
      },
    });

    return inspectionId;
  });
};

export const createInProcessInspection = async (
  data: {
    productionOrderId: number;
    inspectionDate: Date;
    inspectorId: number;
    itemId: number;
    quantityInspected: number;
    quantityPassed: number;
    quantityFailed: number;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  if (data.quantityInspected <= 0) {
    throw new Error('Quantity inspected must be greater than 0');
  }

  if (data.quantityPassed < 0 || data.quantityFailed < 0) {
    throw new Error('Passed and failed quantities cannot be negative');
  }

  if (data.quantityPassed + data.quantityFailed !== data.quantityInspected) {
    throw new Error('Passed + Failed must equal Inspected quantity');
  }

  const inspectionNumber = generateInspectionNumber();
  const result = data.quantityFailed === 0 ? 'pass' : (data.quantityPassed === 0 ? 'fail' : 'conditional_pass');

  const inspectionId = await inspectionRepository.create({
    inspectionNumber,
    inspectionType: 'in_process',
    inspectionDate: data.inspectionDate,
    inspectorId: data.inspectorId,
    referenceType: 'production_order',
    referenceId: data.productionOrderId,
    itemId: data.itemId,
    quantityInspected: data.quantityInspected,
    quantityPassed: data.quantityPassed,
    quantityFailed: data.quantityFailed,
    status: 'completed',
    result,
    notes: data.notes,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_IN_PROCESS_INSPECTION',
    module: 'QUALITY',
    recordType: 'inspection_record',
    recordId: inspectionId,
    newValues: {
      inspectionNumber,
      productionOrderId: data.productionOrderId,
      itemId: data.itemId,
      quantityInspected: data.quantityInspected,
      quantityPassed: data.quantityPassed,
      quantityFailed: data.quantityFailed,
      result,
    },
  });

  return inspectionId;
};
