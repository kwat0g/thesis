import * as productionDashboardRepo from '../../repositories/dashboard/productionDashboardRepository';
import * as inventoryDashboardRepo from '../../repositories/dashboard/inventoryDashboardRepository';
import * as purchasingDashboardRepo from '../../repositories/dashboard/purchasingDashboardRepository';
import * as accountingDashboardRepo from '../../repositories/dashboard/accountingDashboardRepository';
import * as maintenanceDashboardRepo from '../../repositories/dashboard/maintenanceDashboardRepository';
import {
  ProductionDashboard,
  InventoryDashboard,
  PurchasingDashboard,
  AccountingDashboard,
  MaintenanceDashboard,
  ExecutiveSummary,
} from '../../types/dashboard';

export const getProductionDashboard = async (): Promise<ProductionDashboard> => {
  return await productionDashboardRepo.getProductionDashboard();
};

export const getInventoryDashboard = async (): Promise<InventoryDashboard> => {
  return await inventoryDashboardRepo.getInventoryDashboard();
};

export const getPurchasingDashboard = async (): Promise<PurchasingDashboard> => {
  return await purchasingDashboardRepo.getPurchasingDashboard();
};

export const getAccountingDashboard = async (): Promise<AccountingDashboard> => {
  return await accountingDashboardRepo.getAccountingDashboard();
};

export const getMaintenanceDashboard = async (): Promise<MaintenanceDashboard> => {
  return await maintenanceDashboardRepo.getMaintenanceDashboard();
};

export const getExecutiveSummary = async (): Promise<ExecutiveSummary> => {
  const [production, inventory, purchasing, accounting, maintenance] = await Promise.all([
    getProductionDashboard(),
    getInventoryDashboard(),
    getPurchasingDashboard(),
    getAccountingDashboard(),
    getMaintenanceDashboard(),
  ]);

  return {
    production,
    inventory,
    purchasing,
    accounting,
    maintenance,
    generatedAt: new Date(),
  };
};
