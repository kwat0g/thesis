import * as purchaseOrderRepository from '@/lib/repositories/purchasing/purchaseOrderRepository';
import * as purchaseRequestRepository from '@/lib/repositories/purchasing/purchaseRequestRepository';
import * as supplierRepository from '@/lib/repositories/master-data/supplierRepository';
import * as itemRepository from '@/lib/repositories/master-data/itemRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { PurchaseOrder, PurchaseOrderLine } from '@/lib/types/purchasing';
import { PaginatedResponse } from '@/lib/types/common';

export const getPOById = async (id: number): Promise<PurchaseOrder | null> => {
  return await purchaseOrderRepository.findById(id);
};

export const getPOByNumber = async (poNumber: string): Promise<PurchaseOrder | null> => {
  return await purchaseOrderRepository.findByPONumber(poNumber);
};

export const getAllPOs = async (filters?: {
  status?: string;
  approvalStatus?: string;
  supplierId?: number;
  fromDate?: Date;
  toDate?: Date;
}): Promise<PurchaseOrder[]> => {
  return await purchaseOrderRepository.findAll(filters);
};

export const getPOsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string;
    approvalStatus?: string;
    supplierId?: number;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PaginatedResponse<PurchaseOrder>> => {
  const { data, total } = await purchaseOrderRepository.findPaginated(page, pageSize, filters);
  
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

export const getPOLines = async (poId: number): Promise<PurchaseOrderLine[]> => {
  return await purchaseOrderRepository.findLinesByPO(poId);
};

const generatePONumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `PO-${year}${month}${day}-${time}`;
};

export const createPOFromPR = async (
  prId: number,
  data: {
    supplierId: number;
    orderDate: Date;
    expectedDeliveryDate: Date;
    lines: Array<{
      itemId: number;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    notes?: string;
    submitForApproval?: boolean;
  },
  createdBy?: number
): Promise<number> => {
  const pr = await purchaseRequestRepository.findById(prId);
  if (!pr) {
    throw new Error('Purchase request not found');
  }

  if (pr.status !== 'approved') {
    throw new Error('Only approved purchase requests can be converted to PO');
  }

  if (pr.poId) {
    throw new Error('Purchase request has already been converted to PO');
  }

  const supplier = await supplierRepository.findById(data.supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  if (!supplier.isActive) {
    throw new Error('Supplier is not active');
  }

  if (!data.lines || data.lines.length === 0) {
    throw new Error('Purchase order must have at least one line item');
  }

  let totalAmount = 0;
  for (const line of data.lines) {
    const item = await itemRepository.findById(line.itemId);
    if (!item) {
      throw new Error(`Item with ID ${line.itemId} not found`);
    }

    if (line.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (line.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    totalAmount += line.quantity * line.unitPrice;
  }

  const poNumber = generatePONumber();
  const status = data.submitForApproval ? 'pending_approval' : 'draft';

  const poId = await purchaseOrderRepository.create({
    poNumber,
    prId,
    supplierId: data.supplierId,
    orderDate: data.orderDate,
    expectedDeliveryDate: data.expectedDeliveryDate,
    status,
    approvalStatus: 'pending',
    totalAmount,
    notes: data.notes,
    createdBy,
  });

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const lineTotal = line.quantity * line.unitPrice;
    await purchaseOrderRepository.createLine({
      poId,
      lineNumber: i + 1,
      itemId: line.itemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal,
      notes: line.notes,
    });
  }

  await purchaseRequestRepository.update(prId, {
    status: 'converted_to_po',
    poId,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE_PO_FROM_PR',
    module: 'PURCHASING',
    recordType: 'purchase_order',
    recordId: poId,
    newValues: {
      poNumber,
      prId,
      supplierId: data.supplierId,
      totalAmount,
      lineCount: data.lines.length,
      status,
    },
  });

  return poId;
};

export const createPO = async (
  data: {
    supplierId: number;
    orderDate: Date;
    expectedDeliveryDate: Date;
    lines: Array<{
      itemId: number;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    notes?: string;
    submitForApproval?: boolean;
  },
  createdBy?: number
): Promise<number> => {
  const supplier = await supplierRepository.findById(data.supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  if (!supplier.isActive) {
    throw new Error('Supplier is not active');
  }

  if (!data.lines || data.lines.length === 0) {
    throw new Error('Purchase order must have at least one line item');
  }

  let totalAmount = 0;
  for (const line of data.lines) {
    const item = await itemRepository.findById(line.itemId);
    if (!item) {
      throw new Error(`Item with ID ${line.itemId} not found`);
    }

    if (line.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (line.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    totalAmount += line.quantity * line.unitPrice;
  }

  const poNumber = generatePONumber();
  const status = data.submitForApproval ? 'pending_approval' : 'draft';

  const poId = await purchaseOrderRepository.create({
    poNumber,
    supplierId: data.supplierId,
    orderDate: data.orderDate,
    expectedDeliveryDate: data.expectedDeliveryDate,
    status,
    approvalStatus: 'pending',
    totalAmount,
    notes: data.notes,
    createdBy,
  });

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const lineTotal = line.quantity * line.unitPrice;
    await purchaseOrderRepository.createLine({
      poId,
      lineNumber: i + 1,
      itemId: line.itemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal,
      notes: line.notes,
    });
  }

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'PURCHASING',
    recordType: 'purchase_order',
    recordId: poId,
    newValues: {
      poNumber,
      supplierId: data.supplierId,
      totalAmount,
      lineCount: data.lines.length,
      status,
    },
  });

  return poId;
};

export const updatePO = async (
  id: number,
  data: {
    supplierId?: number;
    expectedDeliveryDate?: Date;
    notes?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status !== 'draft') {
    throw new Error('Only draft purchase orders can be updated');
  }

  if (data.supplierId !== undefined) {
    const supplier = await supplierRepository.findById(data.supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (!supplier.isActive) {
      throw new Error('Supplier is not active');
    }
  }

  const success = await purchaseOrderRepository.update(id, {
    supplierId: data.supplierId,
    expectedDeliveryDate: data.expectedDeliveryDate,
    notes: data.notes,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: {
        supplierId: existingPO.supplierId,
        expectedDeliveryDate: existingPO.expectedDeliveryDate,
        notes: existingPO.notes,
      },
      newValues: data,
    });
  }

  return success;
};

export const submitPOForApproval = async (
  id: number,
  submittedBy?: number
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status !== 'draft') {
    throw new Error('Only draft purchase orders can be submitted for approval');
  }

  const lines = await purchaseOrderRepository.findLinesByPO(id);
  if (lines.length === 0) {
    throw new Error('Cannot submit purchase order without line items');
  }

  const success = await purchaseOrderRepository.update(id, {
    status: 'pending_approval',
    updatedBy: submittedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: submittedBy,
      action: 'SUBMIT_FOR_APPROVAL',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: { status: 'draft' },
      newValues: { status: 'pending_approval' },
    });
  }

  return success;
};

export const approvePO = async (
  id: number,
  approvedBy: number
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status !== 'pending_approval') {
    throw new Error('Only pending purchase orders can be approved');
  }

  if (existingPO.createdBy === approvedBy) {
    throw new Error('Cannot approve your own purchase order');
  }

  const success = await purchaseOrderRepository.update(id, {
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
      recordType: 'purchase_order',
      recordId: id,
      oldValues: { status: 'pending_approval', approvalStatus: 'pending' },
      newValues: { status: 'approved', approvalStatus: 'approved', approvedBy },
    });
  }

  return success;
};

export const rejectPO = async (
  id: number,
  rejectedBy: number,
  reason?: string
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status !== 'pending_approval') {
    throw new Error('Only pending purchase orders can be rejected');
  }

  if (existingPO.createdBy === rejectedBy) {
    throw new Error('Cannot reject your own purchase order');
  }

  const success = await purchaseOrderRepository.update(id, {
    status: 'draft',
    approvalStatus: 'rejected',
    rejectionReason: reason,
    updatedBy: rejectedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: rejectedBy,
      action: 'REJECT',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: { status: 'pending_approval', approvalStatus: 'pending' },
      newValues: { status: 'draft', approvalStatus: 'rejected', rejectionReason: reason },
    });
  }

  return success;
};

export const sendPO = async (
  id: number,
  sentBy?: number
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status !== 'approved') {
    throw new Error('Only approved purchase orders can be sent');
  }

  const success = await purchaseOrderRepository.update(id, {
    status: 'sent',
    updatedBy: sentBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: sentBy,
      action: 'SEND',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: { status: 'approved' },
      newValues: { status: 'sent' },
    });
  }

  return success;
};

export const closePO = async (
  id: number,
  closedBy?: number
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status === 'closed') {
    throw new Error('Purchase order is already closed');
  }

  if (existingPO.status === 'cancelled') {
    throw new Error('Cannot close cancelled purchase order');
  }

  const success = await purchaseOrderRepository.update(id, {
    status: 'closed',
    updatedBy: closedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: closedBy,
      action: 'CLOSE',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: { status: existingPO.status },
      newValues: { status: 'closed' },
    });
  }

  return success;
};

export const cancelPO = async (
  id: number,
  cancelledBy?: number,
  reason?: string
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status === 'closed') {
    throw new Error('Cannot cancel closed purchase order');
  }

  if (existingPO.status === 'cancelled') {
    throw new Error('Purchase order is already cancelled');
  }

  const success = await purchaseOrderRepository.update(id, {
    status: 'cancelled',
    updatedBy: cancelledBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: cancelledBy,
      action: 'CANCEL',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: { status: existingPO.status },
      newValues: { status: 'cancelled', cancellationReason: reason },
    });
  }

  return success;
};

export const deletePO = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingPO = await purchaseOrderRepository.findById(id);
  if (!existingPO) {
    throw new Error('Purchase order not found');
  }

  if (existingPO.status !== 'draft') {
    throw new Error('Only draft purchase orders can be deleted');
  }

  if (existingPO.prId) {
    await purchaseRequestRepository.update(existingPO.prId, {
      status: 'approved',
      poId: undefined,
    });
  }

  await purchaseOrderRepository.deleteLinesByPO(id);
  const success = await purchaseOrderRepository.deletePO(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'PURCHASING',
      recordType: 'purchase_order',
      recordId: id,
      oldValues: {
        poNumber: existingPO.poNumber,
        supplierId: existingPO.supplierId,
        totalAmount: existingPO.totalAmount,
      },
    });
  }

  return success;
};
