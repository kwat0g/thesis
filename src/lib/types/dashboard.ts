import { BaseEntity } from './common';

export interface ProductionDashboard {
  totalOrders: number;
  ordersByStatus: {
    draft: number;
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  inProgressOrders: number;
  delayedOrders: number;
  completionRate: number;
}

export interface InventoryDashboard {
  totalItems: number;
  stockByStatus: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    reserved: number;
  };
  lowStockItems: Array<{
    itemId: number;
    itemCode: string;
    itemName: string;
    currentStock: number;
    minStock: number;
    warehouseId: number;
  }>;
  totalStockValue: number;
}

export interface PurchasingDashboard {
  openPRs: number;
  openPOs: number;
  pendingPRApprovals: number;
  pendingPOApprovals: number;
  prsByStatus: {
    draft: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    converted_to_po: number;
    cancelled: number;
  };
  posByStatus: {
    draft: number;
    pending_approval: number;
    approved: number;
    sent: number;
    partially_received: number;
    received: number;
    closed: number;
    cancelled: number;
  };
}

export interface AccountingDashboard {
  totalOutstandingAP: number;
  totalOverdueAP: number;
  overdueInvoiceCount: number;
  apAgingSummary: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
  invoicesByStatus: {
    pending: number;
    approved: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
}

export interface MaintenanceDashboard {
  openWorkOrders: number;
  workOrdersByStatus: {
    pending: number;
    approved: number;
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  machinesWithFrequentBreakdowns: Array<{
    machineId: number;
    machineCode: string;
    machineName: string;
    breakdownCount: number;
    lastBreakdownDate?: Date;
  }>;
  overdueMaintenanceSchedules: number;
}

export interface ExecutiveSummary {
  production: ProductionDashboard;
  inventory: InventoryDashboard;
  purchasing: PurchasingDashboard;
  accounting: AccountingDashboard;
  maintenance: MaintenanceDashboard;
  generatedAt: Date;
}
