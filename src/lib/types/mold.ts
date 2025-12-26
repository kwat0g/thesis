import { BaseEntity } from './common';

export interface MoldUsage {
  id: number;
  moldId: number;
  workOrderId: number;
  usageStart: Date;
  usageEnd?: Date;
  shotsProduced: number;
  status: 'in_use' | 'completed';
  notes?: string;
  createdAt: Date;
  createdBy?: number;
}

export interface MoldConditionHistory {
  id: number;
  moldId: number;
  previousStatus?: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  newStatus: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  changeDate: Date;
  reason?: string;
  totalShotsAtChange: number;
  conditionNotes?: string;
  changedBy?: number;
  createdAt: Date;
}

export interface MoldMaintenanceRecord extends BaseEntity {
  moldId: number;
  maintenanceWorkOrderId?: number;
  maintenanceType: 'preventive' | 'corrective' | 'inspection' | 'cleaning';
  maintenanceDate: Date;
  technicianId?: number;
  durationHours: number;
  workPerformed: string;
  partsReplaced?: string;
  findings?: string;
  recommendations?: string;
  shotsBeforeMaintenance: number;
  nextMaintenanceShots?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
