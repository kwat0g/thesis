import { BaseEntity } from './common';

export interface QCInspection extends BaseEntity {
  inspectionNumber: string;
  inspectionType: 'incoming' | 'in_process' | 'final' | 'supplier_audit';
  referenceType: string;
  referenceId: number;
  itemId: number;
  quantityInspected: number;
  quantityAccepted: number;
  quantityRejected: number;
  inspectorId: number;
  inspectionDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'passed' | 'failed' | 'conditional';
  notes?: string;
}

export interface QCInspectionLine {
  id: number;
  inspectionId: number;
  parameterId: number;
  specification?: string;
  measuredValue?: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
  createdAt: Date;
}

export interface QCParameter {
  id: number;
  parameterCode: string;
  parameterName: string;
  parameterType: 'dimensional' | 'visual' | 'functional' | 'chemical' | 'other';
  measurementUnit?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QCNCR extends BaseEntity {
  ncrNumber: string;
  inspectionId?: number;
  itemId: number;
  quantityAffected: number;
  defectDescription: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  disposition?: 'pending' | 'rework' | 'scrap' | 'use_as_is' | 'return_to_supplier';
  status: 'open' | 'in_progress' | 'under_investigation' | 'action_taken' | 'closed';
  raisedBy: number;
  raisedDate: Date;
  closedBy?: number;
  closedDate?: Date;
}
