import { BaseEntity } from './common';

export interface PurchaseRequest extends BaseEntity {
  prNumber: string;
  requestDate: Date;
  requiredDate: Date;
  departmentId?: number;
  requestorId: number;
  justification?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'po_created' | 'converted_to_po' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  poId?: number;
}

export interface PurchaseRequestLine {
  id: number;
  prId: number;
  lineNumber: number;
  itemId: number;
  quantity: number;
  estimatedUnitPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PRApproval {
  id: number;
  prId: number;
  approverId: number;
  approvalLevel: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
  createdAt: Date;
}

export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  prId?: number;
  supplierId: number;
  poDate: Date;
  expectedDeliveryDate: Date;
  paymentTerms?: string;
  totalAmount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

export interface PurchaseOrderLine {
  id: number;
  poId: number;
  lineNumber: number;
  itemId: number;
  quantity: number;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface POApproval {
  id: number;
  poId: number;
  approverId: number;
  approvalLevel: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
  createdAt: Date;
}
