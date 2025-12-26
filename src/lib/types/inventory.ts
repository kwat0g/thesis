import { BaseEntity } from './common';

export interface InventoryBalance {
  id: number;
  itemId: number;
  warehouseId: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityInspection: number;
  quantityRejected: number;
  lastUpdated: Date;
}

export interface InventoryTransaction {
  id: number;
  transactionNumber: string;
  transactionDate: Date;
  transactionType: 'receipt' | 'issue' | 'adjustment' | 'transfer' | 'return' | 'reservation' | 'unreservation';
  itemId: number;
  warehouseId: number;
  quantity: number;
  unitCost?: number;
  statusFrom?: string;
  statusTo?: string;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdAt: Date;
  createdBy?: number;
}

export interface GoodsReceipt extends BaseEntity {
  grNumber: string;
  poId: number;
  receiptDate: Date;
  warehouseId: number;
  receiverId: number;
  status: 'draft' | 'completed' | 'cancelled' | 'pending_qc' | 'qc_passed' | 'qc_failed';
  notes?: string;
}

export interface GoodsReceiptLine {
  id: number;
  grId: number;
  lineNumber: number;
  poLineId: number;
  itemId: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoodsIssue extends BaseEntity {
  giNumber: string;
  productionOrderId?: number;
  issueDate: Date;
  warehouseId: number;
  workOrderId?: number;
  issuedBy: number;
  issuedTo?: number;
  status: 'draft' | 'completed' | 'cancelled';
  notes?: string;
}

export interface GoodsIssueLine {
  id: number;
  giId: number;
  lineNumber: number;
  itemId: number;
  quantityIssued: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryReservation extends BaseEntity {
  itemId: number;
  warehouseId: number;
  quantityReserved: number;
  referenceType: string;
  referenceId: number;
  reservationDate: Date;
  expiryDate?: Date;
  status: 'active' | 'fulfilled' | 'cancelled';
}
