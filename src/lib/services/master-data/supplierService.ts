import * as supplierRepository from '@/lib/repositories/master-data/supplierRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { Supplier } from '@/lib/types/master-data';
import { PaginatedResponse } from '@/lib/types/common';

export const getSupplierById = async (id: number): Promise<Supplier | null> => {
  return await supplierRepository.findById(id);
};

export const getSupplierByCode = async (supplierCode: string): Promise<Supplier | null> => {
  return await supplierRepository.findByCode(supplierCode);
};

export const getAllSuppliers = async (isActive?: boolean): Promise<Supplier[]> => {
  return await supplierRepository.findAll(isActive);
};

export const getSuppliersPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  isActive?: boolean
): Promise<PaginatedResponse<Supplier>> => {
  const { data, total } = await supplierRepository.findPaginated(page, pageSize, isActive);
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

export const createSupplier = async (
  data: {
    supplierCode: string;
    supplierName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: string;
  },
  createdBy?: number
): Promise<number> => {
  const existingSupplier = await supplierRepository.findByCode(data.supplierCode);
  if (existingSupplier) {
    throw new Error(`Supplier code '${data.supplierCode}' already exists`);
  }

  if (!data.supplierCode || data.supplierCode.trim() === '') {
    throw new Error('Supplier code is required');
  }

  if (!data.supplierName || data.supplierName.trim() === '') {
    throw new Error('Supplier name is required');
  }

  const supplierId = await supplierRepository.create({
    supplierCode: data.supplierCode.trim().toUpperCase(),
    supplierName: data.supplierName.trim(),
    contactPerson: data.contactPerson?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    address: data.address?.trim(),
    paymentTerms: data.paymentTerms?.trim(),
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'MASTER_DATA',
    recordType: 'supplier',
    recordId: supplierId,
    newValues: { supplierCode: data.supplierCode, supplierName: data.supplierName },
  });

  return supplierId;
};

export const updateSupplier = async (
  id: number,
  data: {
    supplierName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: string;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingSupplier = await supplierRepository.findById(id);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  if (data.supplierName !== undefined && data.supplierName.trim() === '') {
    throw new Error('Supplier name cannot be empty');
  }

  const success = await supplierRepository.update(id, {
    supplierName: data.supplierName?.trim(),
    contactPerson: data.contactPerson?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    address: data.address?.trim(),
    paymentTerms: data.paymentTerms?.trim(),
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MASTER_DATA',
      recordType: 'supplier',
      recordId: id,
      oldValues: { supplierName: existingSupplier.supplierName },
      newValues: data,
    });
  }

  return success;
};

export const deactivateSupplier = async (id: number, updatedBy?: number): Promise<boolean> => {
  const existingSupplier = await supplierRepository.findById(id);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  if (!existingSupplier.isActive) {
    throw new Error('Supplier is already inactive');
  }

  const success = await supplierRepository.deactivate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'DEACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'supplier',
      recordId: id,
    });
  }

  return success;
};

export const activateSupplier = async (id: number, updatedBy?: number): Promise<boolean> => {
  const existingSupplier = await supplierRepository.findById(id);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  if (existingSupplier.isActive) {
    throw new Error('Supplier is already active');
  }

  const success = await supplierRepository.activate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'ACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'supplier',
      recordId: id,
    });
  }

  return success;
};

export const deleteSupplier = async (id: number, deletedBy?: number): Promise<boolean> => {
  const existingSupplier = await supplierRepository.findById(id);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  const success = await supplierRepository.deleteSupplier(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'MASTER_DATA',
      recordType: 'supplier',
      recordId: id,
      oldValues: { supplierCode: existingSupplier.supplierCode, supplierName: existingSupplier.supplierName },
    });
  }

  return success;
};
