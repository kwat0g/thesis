import { BaseEntity } from './common';

export interface ProductionOrder extends BaseEntity {
  poNumber: string;
  customerPoReference?: string;
  itemId: number;
  quantityOrdered: number;
  quantityProduced: number;
  requiredDate: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'pending_approval' | 'approved' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface BOMHeader extends BaseEntity {
  itemId: number;
  version: number;
  effectiveDate: Date;
  isActive: boolean;
}

export interface BOMLine {
  id: number;
  bomHeaderId: number;
  componentItemId: number;
  quantityPerUnit: number;
  scrapPercentage: number;
  lineNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionSchedule extends BaseEntity {
  productionOrderId: number;
  scheduledDate: Date;
  scheduledQuantity: number;
  machineId?: number;
  shiftId?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface WorkOrder extends BaseEntity {
  woNumber: string;
  productionOrderId: number;
  productionScheduleId?: number;
  itemId: number;
  quantityPlanned: number;
  quantityProduced: number;
  quantityScrap: number;
  quantityRework: number;
  machineId?: number;
  moldId?: number;
  supervisorId?: number;
  startDate?: Date;
  endDate?: Date;
  status: 'pending' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ProductionOutput {
  id: number;
  workOrderId: number;
  operatorId: number;
  outputDate: Date;
  quantityGood: number;
  quantityScrap: number;
  quantityRework: number;
  shiftId?: number;
  notes?: string;
  createdAt: Date;
  createdBy?: number;
}

export interface ProductionDowntime {
  id: number;
  workOrderId: number;
  machineId?: number;
  downtimeStart: Date;
  downtimeEnd?: Date;
  durationMinutes?: number;
  reason: string;
  category: 'breakdown' | 'changeover' | 'material_shortage' | 'quality_issue' | 'other';
  notes?: string;
  createdAt: Date;
  createdBy?: number;
}
