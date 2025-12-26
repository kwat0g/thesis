import * as ncrRepository from '@/lib/repositories/quality/ncrRepository';
import * as inspectionRepository from '@/lib/repositories/quality/inspectionRepository';
import * as inventoryBalanceRepository from '@/lib/repositories/inventory/inventoryBalanceRepository';
import * as inventoryTransactionRepository from '@/lib/repositories/inventory/inventoryTransactionRepository';
import * as goodsReceiptRepository from '@/lib/repositories/inventory/goodsReceiptRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { withTransaction } from '@/lib/database/transaction';
import { QCNCR } from '@/lib/types/quality';
import { PaginatedResponse } from '@/lib/types/common';

export const getNCRById = async (id: number): Promise<QCNCR | null> => {
  return await ncrRepository.findById(id);
};

export const getNCRByNumber = async (ncrNumber: string): Promise<QCNCR | null> => {
  return await ncrRepository.findByNCRNumber(ncrNumber);
};

export const getAllNCRs = async (filters?: {
  disposition?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}): Promise<QCNCR[]> => {
  return await ncrRepository.findAll(filters);
};

export const getNCRsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    disposition?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<QCNCR>> => {
  const { data, total } = await ncrRepository.findPaginated(page, pageSize, filters);
  
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

const generateNCRNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `QCNCR-${year}${month}${day}-${time}`;
};

export const createNCR = async (
  data: {
    inspectionId: number;
    ncrDate: Date;
    itemId: number;
    quantityAffected: number;
    defectDescription: string;
    rootCause?: string;
    correctiveAction?: string;
    notes?: string;
  },
  createdBy?: number
): Promise<number> => {
  const inspection = await inspectionRepository.findById(data.inspectionId);
  if (!inspection) {
    throw new Error('Inspection record not found');
  }

  if (inspection.status === 'passed') {
    throw new Error('Cannot create QCNCR for passed inspection');
  }

  if (!data.defectDescription || data.defectDescription.trim() === '') {
    throw new Error('Defect description is required');
  }

  if (data.quantityAffected <= 0) {
    throw new Error('Quantity affected must be greater than 0');
  }

  if (data.quantityAffected > inspection.quantityRejected) {
    throw new Error('Quantity affected cannot exceed rejected quantity from inspection');
  }

  const ncrNumber = generateNCRNumber();

  const ncrId = await ncrRepository.create({
    ncrNumber,
    inspectionId: data.inspectionId,
    ncrDate: data.ncrDate,
    itemId: data.itemId,
    quantityAffected: data.quantityAffected,
    defectDescription: data.defectDescription,
    rootCause: data.rootCause,
    correctiveAction: data.correctiveAction,
    disposition: 'pending',
    status: 'open',
    notes: data.notes,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_NCR',
    module: 'QUALITY',
    recordType: 'QCNCR',
    recordId: ncrId,
    newValues: {
      ncrNumber,
      inspectionId: data.inspectionId,
      itemId: data.itemId,
      quantityAffected: data.quantityAffected,
      defectDescription: data.defectDescription,
    },
  });

  return ncrId;
};

export const updateNCR = async (
  id: number,
  data: {
    rootCause?: string;
    correctiveAction?: string;
    notes?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingNCR = await ncrRepository.findById(id);
  if (!existingNCR) {
    throw new Error('QCNCR not found');
  }

  if (existingNCR.status === 'closed') {
    throw new Error('Cannot update closed QCNCR');
  }

  const success = await ncrRepository.update(id, {
    rootCause: data.rootCause,
    correctiveAction: data.correctiveAction,
    notes: data.notes,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_NCR',
      module: 'QUALITY',
      recordType: 'QCNCR',
      recordId: id,
      oldValues: {
        rootCause: existingNCR.rootCause,
        correctiveAction: existingNCR.correctiveAction,
      },
      newValues: data,
    });
  }

  return success;
};

export const setNCRDisposition = async (
  id: number,
  disposition: 'rework' | 'scrap' | 'use_as_is' | 'return_to_supplier',
  dispositionBy?: number
): Promise<boolean> => {
  return await withTransaction(async (connection) => {
    const existingNCR = await ncrRepository.findById(id);
    if (!existingNCR) {
      throw new Error('QCNCR not found');
    }

    if (existingNCR.status === 'closed') {
      throw new Error('Cannot change disposition of closed QCNCR');
    }

    let warehouseId: number | undefined;
    if (existingNCR.inspectionId) {
      const inspection = await inspectionRepository.findById(existingNCR.inspectionId);
      if (!inspection) {
        throw new Error('Associated inspection not found');
      }

      if (inspection.referenceType === 'goods_receipt') {
        const gr = await goodsReceiptRepository.findById(inspection.referenceId);
        warehouseId = gr?.warehouseId;
      }
    }

    if (disposition === 'scrap' && warehouseId) {
      await inventoryBalanceRepository.adjustQuantity(
        existingNCR.itemId,
        warehouseId,
        'quantityRejected',
        -existingNCR.quantityAffected
      );

      await inventoryTransactionRepository.create({
        transactionDate: new Date(),
        transactionType: 'adjustment',
        itemId: existingNCR.itemId,
        warehouseId,
        quantity: -existingNCR.quantityAffected,
        statusFrom: 'rejected',
        referenceType: 'ncr_disposition',
        referenceId: id,
        notes: `QCNCR ${existingNCR.ncrNumber} - Scrapped`,
        createdBy: dispositionBy,
      });
    } else if (disposition === 'rework' && warehouseId) {
      await inventoryBalanceRepository.adjustQuantity(
        existingNCR.itemId,
        warehouseId,
        'quantityRejected',
        -existingNCR.quantityAffected
      );

      await inventoryBalanceRepository.adjustQuantity(
        existingNCR.itemId,
        warehouseId,
        'quantityInspection',
        existingNCR.quantityAffected
      );

      await inventoryTransactionRepository.create({
        transactionDate: new Date(),
        transactionType: 'adjustment',
        itemId: existingNCR.itemId,
        warehouseId,
        quantity: existingNCR.quantityAffected,
        statusFrom: 'rejected',
        statusTo: 'under_inspection',
        referenceType: 'ncr_disposition',
        referenceId: id,
        notes: `QCNCR ${existingNCR.ncrNumber} - Sent for Rework`,
        createdBy: dispositionBy,
      });
    } else if (disposition === 'use_as_is' && warehouseId) {
      await inventoryBalanceRepository.adjustQuantity(
        existingNCR.itemId,
        warehouseId,
        'quantityRejected',
        -existingNCR.quantityAffected
      );

      await inventoryBalanceRepository.adjustQuantity(
        existingNCR.itemId,
        warehouseId,
        'quantityAvailable',
        existingNCR.quantityAffected
      );

      await inventoryTransactionRepository.create({
        transactionDate: new Date(),
        transactionType: 'adjustment',
        itemId: existingNCR.itemId,
        warehouseId,
        quantity: existingNCR.quantityAffected,
        statusFrom: 'rejected',
        statusTo: 'available',
        referenceType: 'ncr_disposition',
        referenceId: id,
        notes: `QCNCR ${existingNCR.ncrNumber} - Use As-Is`,
        createdBy: dispositionBy,
      });
    }

    const success = await ncrRepository.update(id, {
      disposition,
      status: 'in_progress',
      updatedBy: dispositionBy,
    });

    if (success) {
      await auditLogRepository.create({
        userId: dispositionBy,
        action: 'SET_NCR_DISPOSITION',
        module: 'QUALITY',
        recordType: 'QCNCR',
        recordId: id,
        oldValues: { disposition: existingNCR.disposition },
        newValues: { disposition },
      });
    }

    return success;
  });
};

export const closeNCR = async (
  id: number,
  closedBy?: number
): Promise<boolean> => {
  const existingNCR = await ncrRepository.findById(id);
  if (!existingNCR) {
    throw new Error('QCNCR not found');
  }

  if (existingNCR.status === 'closed') {
    throw new Error('QCNCR is already closed');
  }

  if (existingNCR.disposition === 'pending') {
    throw new Error('Cannot close QCNCR without disposition');
  }

  const success = await ncrRepository.update(id, {
    status: 'closed',
    closedDate: new Date(),
    closedBy,
    updatedBy: closedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: closedBy,
      action: 'CLOSE_NCR',
      module: 'QUALITY',
      recordType: 'QCNCR',
      recordId: id,
      oldValues: { status: existingNCR.status },
      newValues: { status: 'closed' },
    });
  }

  return success;
};
