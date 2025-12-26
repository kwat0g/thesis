import * as purchaseRequestRepository from '@/lib/repositories/purchasing/purchaseRequestRepository';
import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { PurchaseRequest, PurchaseRequestLine } from '@/lib/types/purchasing';
import { PaginatedResponse } from '@/lib/types/common';

export const getPRById = async (id: number): Promise<PurchaseRequest | null> => {
  return await purchaseRequestRepository.findById(id);
};

export const getPRByNumber = async (prNumber: string): Promise<PurchaseRequest | null> => {
  return await purchaseRequestRepository.findByPRNumber(prNumber);
};

export const getAllPRs = async (filters?: {
  status?: string;
  approvalStatus?: string;
  requestorId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<PurchaseRequest[]> => {
  return await purchaseRequestRepository.findAll(filters);
};

export const getPRsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    approvalStatus?: string;
    requestorId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<PurchaseRequest>> => {
  const { data, total } = await purchaseRequestRepository.findPaginated(page, pageSize, filters);
  
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

export const getPRLines = async (prId: number): Promise<PurchaseRequestLine[]> => {
  return await purchaseRequestRepository.findLinesByPR(prId);
};

const generatePRNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `PR-${year}${month}${day}-${time}`;
};

export const createPR = async (
  data: {
    requestDate: Date;
    requiredDate: Date;
    requestorId: number;
    justification?: string;
    lines: Array<{
      itemId: number;
      quantity: number;
      notes?: string;
    }>;
    submitForApproval?: boolean;
  },
  createdBy?: number
): Promise<number> => {
  if (!data.lines || data.lines.length === 0) {
    throw new Error('Purchase request must have at least one line item');
  }

  if (!data.requestDate) {
    throw new Error('Request date is required');
  }

  if (!data.requiredDate) {
    throw new Error('Required date is required');
  }

  const requiredDate = new Date(data.requiredDate);
  const requestDate = new Date(data.requestDate);
  
  if (requiredDate < requestDate) {
    throw new Error('Required date cannot be before request date');
  }

  for (const line of data.lines) {
    const item = await itemRepository.findById(line.itemId);
    if (!item) {
      throw new Error(`Item with ID ${line.itemId} not found`);
    }

    if (line.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }

  const prNumber = generatePRNumber();
  const status = data.submitForApproval ? 'pending_approval' : 'draft';

  const prId = await purchaseRequestRepository.create({
    prNumber,
    requestDate: data.requestDate,
    requiredDate: data.requiredDate,
    requestorId: data.requestorId,
    justification: data.justification,
    status,
    approvalStatus: 'pending',
    createdBy,
  });

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    await purchaseRequestRepository.createLine({
      prId,
      lineNumber: i + 1,
      itemId: line.itemId,
      quantity: line.quantity,
      notes: line.notes,
    });
  }

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'PURCHASING',
    recordType: 'purchase_request',
    recordId: prId,
    newValues: {
      prNumber,
      requestorId: data.requestorId,
      requiredDate: data.requiredDate,
      lineCount: data.lines.length,
      status,
    },
  });

  return prId;
};

export const updatePR = async (
  id: number,
  data: {
    requiredDate?: Date;
    justification?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingPR = await purchaseRequestRepository.findById(id);
  if (!existingPR) {
    throw new Error('Purchase request not found');
  }

  if (existingPR.status !== 'draft') {
    throw new Error('Only draft purchase requests can be updated');
  }

  if (data.requiredDate !== undefined) {
    const requiredDate = new Date(data.requiredDate);
    const requestDate = new Date(existingPR.requestDate);
    
    if (requiredDate < requestDate) {
      throw new Error('Required date cannot be before request date');
    }
  }

  const success = await purchaseRequestRepository.update(id, {
    requiredDate: data.requiredDate,
    justification: data.justification,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'PURCHASING',
      recordType: 'purchase_request',
      recordId: id,
      oldValues: {
        requiredDate: existingPR.requiredDate,
        justification: existingPR.justification,
      },
      newValues: data,
    });
  }

  return success;
};

export const submitPRForApproval = async (
  id: number,
  submittedBy?: number
): Promise<boolean> => {
  const existingPR = await purchaseRequestRepository.findById(id);
  if (!existingPR) {
    throw new Error('Purchase request not found');
  }

  if (existingPR.status !== 'draft') {
    throw new Error('Only draft purchase requests can be submitted for approval');
  }

  const lines = await purchaseRequestRepository.findLinesByPR(id);
  if (lines.length === 0) {
    throw new Error('Cannot submit purchase request without line items');
  }

  const success = await purchaseRequestRepository.update(id, {
    status: 'pending_approval',
    updatedBy: submittedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: submittedBy,
      action: 'SUBMIT_FOR_APPROVAL',
      module: 'PURCHASING',
      recordType: 'purchase_request',
      recordId: id,
      oldValues: { status: 'draft' },
      newValues: { status: 'pending_approval' },
    });
  }

  return success;
};

export const approvePR = async (
  id: number,
  approvedBy: number
): Promise<boolean> => {
  const existingPR = await purchaseRequestRepository.findById(id);
  if (!existingPR) {
    throw new Error('Purchase request not found');
  }

  if (existingPR.status !== 'pending_approval') {
    throw new Error('Only pending purchase requests can be approved');
  }

  if (existingPR.requestorId === approvedBy) {
    throw new Error('Cannot approve your own purchase request');
  }

  const success = await purchaseRequestRepository.update(id, {
    status: 'approved',
    approvalStatus: 'approved',
    approvedBy,
    approvedAt: new Date(),
    updatedBy: approvedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: approvedBy,
      action: 'APPROVE',
      module: 'PURCHASING',
      recordType: 'purchase_request',
      recordId: id,
      oldValues: { status: 'pending_approval', approvalStatus: 'pending' },
      newValues: { status: 'approved', approvalStatus: 'approved', approvedBy },
    });
  }

  return success;
};

export const rejectPR = async (
  id: number,
  rejectedBy: number,
  reason?: string
): Promise<boolean> => {
  const existingPR = await purchaseRequestRepository.findById(id);
  if (!existingPR) {
    throw new Error('Purchase request not found');
  }

  if (existingPR.status !== 'pending_approval') {
    throw new Error('Only pending purchase requests can be rejected');
  }

  if (existingPR.requestorId === rejectedBy) {
    throw new Error('Cannot reject your own purchase request');
  }

  const success = await purchaseRequestRepository.update(id, {
    status: 'rejected',
    approvalStatus: 'rejected',
    rejectionReason: reason,
    updatedBy: rejectedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: rejectedBy,
      action: 'REJECT',
      module: 'PURCHASING',
      recordType: 'purchase_request',
      recordId: id,
      oldValues: { status: 'pending_approval', approvalStatus: 'pending' },
      newValues: { status: 'rejected', approvalStatus: 'rejected', rejectionReason: reason },
    });
  }

  return success;
};

export const cancelPR = async (
  id: number,
  cancelledBy?: number,
  reason?: string
): Promise<boolean> => {
  const existingPR = await purchaseRequestRepository.findById(id);
  if (!existingPR) {
    throw new Error('Purchase request not found');
  }

  if (existingPR.status === 'converted_to_po') {
    throw new Error('Cannot cancel purchase request that has been converted to PO');
  }

  if (existingPR.status === 'cancelled') {
    throw new Error('Purchase request is already cancelled');
  }

  const success = await purchaseRequestRepository.update(id, {
    status: 'cancelled',
    updatedBy: cancelledBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: cancelledBy,
      action: 'CANCEL',
      module: 'PURCHASING',
      recordType: 'purchase_request',
      recordId: id,
      oldValues: { status: existingPR.status },
      newValues: { status: 'cancelled', cancellationReason: reason },
    });
  }

  return success;
};

export const deletePR = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingPR = await purchaseRequestRepository.findById(id);
  if (!existingPR) {
    throw new Error('Purchase request not found');
  }

  if (existingPR.status !== 'draft') {
    throw new Error('Only draft purchase requests can be deleted');
  }

  await purchaseRequestRepository.deleteLinesByPR(id);
  const success = await purchaseRequestRepository.deletePR(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'PURCHASING',
      recordType: 'purchase_request',
      recordId: id,
      oldValues: {
        prNumber: existingPR.prNumber,
        requestorId: existingPR.requestorId,
      },
    });
  }

  return success;
};
