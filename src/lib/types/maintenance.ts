import { BaseEntity } from './common';

export interface MaintenanceSchedule extends BaseEntity {
  scheduleCode: string;
  machineId: number;
  maintenanceType: 'preventive' | 'predictive' | 'routine';
  frequencyDays: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate: Date;
  description?: string;
  estimatedDurationHours: number;
  isActive: boolean;
}

export interface MaintenanceWorkOrder extends BaseEntity {
  mwoNumber: string;
  machineId: number;
  maintenanceScheduleId?: number;
  productionDowntimeId?: number;
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestedDate: Date;
  scheduledDate?: Date;
  startedDate?: Date;
  completedDate?: Date;
  assignedTechnicianId?: number;
  problemDescription: string;
  workPerformed?: string;
  rootCause?: string;
  correctiveAction?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: Date;
  estimatedDurationHours: number;
  actualDurationHours: number;
  notes?: string;
}

export interface MaintenanceHistory {
  id: number;
  maintenanceWorkOrderId: number;
  machineId: number;
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  maintenanceDate: Date;
  technicianId?: number;
  durationHours: number;
  workPerformed: string;
  partsReplaced?: string;
  findings?: string;
  recommendations?: string;
  nextActionRequired: boolean;
  createdAt: Date;
  createdBy?: number;
}
