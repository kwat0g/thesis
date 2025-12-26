import * as departmentRepository from '@/lib/repositories/master-data/departmentRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { Department } from '@/lib/types/master-data';
import { PaginatedResponse } from '@/lib/types/common';

export const getDepartmentById = async (id: number): Promise<Department | null> => {
  return await departmentRepository.findById(id);
};

export const getDepartmentByCode = async (deptCode: string): Promise<Department | null> => {
  return await departmentRepository.findByCode(deptCode);
};

export const getAllDepartments = async (isActive?: boolean): Promise<Department[]> => {
  return await departmentRepository.findAll(isActive);
};

export const getDepartmentsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  isActive?: boolean
): Promise<PaginatedResponse<Department>> => {
  const { data, total } = await departmentRepository.findPaginated(page, pageSize, isActive);
  
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

export const createDepartment = async (
  data: {
    deptCode: string;
    deptName: string;
    description?: string;
    managerId?: number;
  },
  createdBy?: number
): Promise<number> => {
  const existingDept = await departmentRepository.findByCode(data.deptCode);
  if (existingDept) {
    throw new Error(`Department code '${data.deptCode}' already exists`);
  }

  if (!data.deptCode || data.deptCode.trim() === '') {
    throw new Error('Department code is required');
  }

  if (!data.deptName || data.deptName.trim() === '') {
    throw new Error('Department name is required');
  }

  const deptId = await departmentRepository.create({
    deptCode: data.deptCode.trim().toUpperCase(),
    deptName: data.deptName.trim(),
    description: data.description?.trim(),
    managerId: data.managerId,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'MASTER_DATA',
    recordType: 'department',
    recordId: deptId,
    newValues: {
      deptCode: data.deptCode,
      deptName: data.deptName,
      description: data.description,
      managerId: data.managerId,
    },
  });

  return deptId;
};

export const updateDepartment = async (
  id: number,
  data: {
    deptName?: string;
    description?: string;
    managerId?: number;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingDept = await departmentRepository.findById(id);
  if (!existingDept) {
    throw new Error('Department not found');
  }

  if (data.deptName !== undefined && data.deptName.trim() === '') {
    throw new Error('Department name cannot be empty');
  }

  const success = await departmentRepository.update(id, {
    deptName: data.deptName?.trim(),
    description: data.description?.trim(),
    managerId: data.managerId,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MASTER_DATA',
      recordType: 'department',
      recordId: id,
      oldValues: {
        deptName: existingDept.deptName,
        description: existingDept.description,
        managerId: existingDept.managerId,
      },
      newValues: {
        deptName: data.deptName,
        description: data.description,
        managerId: data.managerId,
      },
    });
  }

  return success;
};

export const deactivateDepartment = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const existingDept = await departmentRepository.findById(id);
  if (!existingDept) {
    throw new Error('Department not found');
  }

  if (!existingDept.isActive) {
    throw new Error('Department is already inactive');
  }

  const success = await departmentRepository.deactivate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'DEACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'department',
      recordId: id,
    });
  }

  return success;
};

export const activateDepartment = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const existingDept = await departmentRepository.findById(id);
  if (!existingDept) {
    throw new Error('Department not found');
  }

  if (existingDept.isActive) {
    throw new Error('Department is already active');
  }

  const success = await departmentRepository.activate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'ACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'department',
      recordId: id,
    });
  }

  return success;
};

export const deleteDepartment = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingDept = await departmentRepository.findById(id);
  if (!existingDept) {
    throw new Error('Department not found');
  }

  const success = await departmentRepository.deleteDepartment(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'MASTER_DATA',
      recordType: 'department',
      recordId: id,
      oldValues: {
        deptCode: existingDept.deptCode,
        deptName: existingDept.deptName,
      },
    });
  }

  return success;
};
