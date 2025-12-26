import * as maintenanceHistoryRepository from '@/lib/repositories/maintenance/maintenanceHistoryRepository';
import { MaintenanceHistory } from '@/lib/types/maintenance';
import { PaginatedResponse } from '@/lib/types/common';

export const getHistoryById = async (id: number): Promise<MaintenanceHistory | null> => {
  return await maintenanceHistoryRepository.findById(id);
};

export const getHistoryByWorkOrder = async (workOrderId: number): Promise<MaintenanceHistory | null> => {
  return await maintenanceHistoryRepository.findByWorkOrder(workOrderId);
};

export const getHistoryByMachine = async (machineId: number): Promise<MaintenanceHistory[]> => {
  return await maintenanceHistoryRepository.findByMachine(machineId);
};

export const getAllHistory = async (filters?: {
  machineId?: number;
  maintenanceType?: string;
  technicianId?: number;
  fromDate?: Date;
  toDate?: Date;
  nextActionRequired?: boolean;
}): Promise<MaintenanceHistory[]> => {
  return await maintenanceHistoryRepository.findAll(filters);
};

export const getHistoryPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    machineId?: number;
    maintenanceType?: string;
    technicianId?: number;
    fromDate?: Date;
    toDate?: Date;
    nextActionRequired?: boolean;
  }
): Promise<PaginatedResponse<MaintenanceHistory>> => {
  const { data, total } = await maintenanceHistoryRepository.findPaginated(page, pageSize, filters);
  
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
