import { BaseEntity } from './common';

export interface Department extends BaseEntity {
  deptCode: string;
  deptName: string;
  description?: string;
  managerId?: number;
  isActive: boolean;
}

export interface Employee extends BaseEntity {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  departmentId?: number;
  position?: string;
  hireDate?: Date;
  employmentStatus: 'active' | 'on_leave' | 'resigned' | 'terminated';
  salary?: number;
  isActive: boolean;
}

export interface UnitOfMeasure {
  id: number;
  uomCode: string;
  uomName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item extends BaseEntity {
  itemCode: string;
  itemName: string;
  description?: string;
  itemType: 'raw_material' | 'component' | 'finished_good' | 'consumable';
  uomId: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  isActive: boolean;
}

export interface Supplier extends BaseEntity {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  isActive: boolean;
}

export interface Machine extends BaseEntity {
  machineCode: string;
  machineName: string;
  machineType?: string;
  departmentId?: number;
  capacityPerHour?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'breakdown';
  isActive: boolean;
}

export interface Mold extends BaseEntity {
  moldCode: string;
  moldName: string;
  moldType?: string;
  cavityCount: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  totalShots: number;
  maxShots?: number;
  isActive: boolean;
}

export interface Warehouse {
  id: number;
  warehouseCode: string;
  warehouseName: string;
  location?: string;
  warehouseType: 'raw_material' | 'finished_goods' | 'general';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: number;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
