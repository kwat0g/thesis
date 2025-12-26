import * as employeeRepository from '@/lib/repositories/master-data/employeeRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { Employee } from '@/lib/types/master-data';
import { PaginatedResponse } from '@/lib/types/common';

export const getEmployeeById = async (id: number): Promise<Employee | null> => {
  return await employeeRepository.findById(id);
};

export const getEmployeeByCode = async (employeeCode: string): Promise<Employee | null> => {
  return await employeeRepository.findByCode(employeeCode);
};

export const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
  return await employeeRepository.findByEmail(email);
};

export const getAllEmployees = async (filters?: {
  isActive?: boolean;
  departmentId?: number;
  employmentStatus?: string;
}): Promise<Employee[]> => {
  return await employeeRepository.findAll(filters);
};

export const getEmployeesPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    isActive?: boolean;
    departmentId?: number;
    employmentStatus?: string;
  }
): Promise<PaginatedResponse<Employee>> => {
  const { data, total } = await employeeRepository.findPaginated(page, pageSize, filters);
  
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

export const createEmployee = async (
  data: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    departmentId?: number;
    position?: string;
    hireDate?: Date;
    employmentStatus?: 'active' | 'on_leave' | 'resigned' | 'terminated';
    salary?: number;
  },
  createdBy?: number
): Promise<number> => {
  const existingEmployee = await employeeRepository.findByCode(data.employeeCode);
  if (existingEmployee) {
    throw new Error(`Employee code '${data.employeeCode}' already exists`);
  }

  if (data.email) {
    const existingEmail = await employeeRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error(`Email '${data.email}' already exists`);
    }
  }

  if (!data.employeeCode || data.employeeCode.trim() === '') {
    throw new Error('Employee code is required');
  }

  if (!data.firstName || data.firstName.trim() === '') {
    throw new Error('First name is required');
  }

  if (!data.lastName || data.lastName.trim() === '') {
    throw new Error('Last name is required');
  }

  const employeeId = await employeeRepository.create({
    employeeCode: data.employeeCode.trim().toUpperCase(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    departmentId: data.departmentId,
    position: data.position?.trim(),
    hireDate: data.hireDate,
    employmentStatus: data.employmentStatus,
    salary: data.salary,
    createdBy,
  });

  await auditLogRepository.create({
    userId: createdBy,
    action: 'CREATE',
    module: 'MASTER_DATA',
    recordType: 'employee',
    recordId: employeeId,
    newValues: {
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      departmentId: data.departmentId,
      position: data.position,
    },
  });

  return employeeId;
};

export const updateEmployee = async (
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    departmentId?: number;
    position?: string;
    hireDate?: Date;
    employmentStatus?: 'active' | 'on_leave' | 'resigned' | 'terminated';
    salary?: number;
  },
  updatedBy?: number
): Promise<boolean> => {
  const existingEmployee = await employeeRepository.findById(id);
  if (!existingEmployee) {
    throw new Error('Employee not found');
  }

  if (data.email && data.email !== existingEmployee.email) {
    const existingEmail = await employeeRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error(`Email '${data.email}' already exists`);
    }
  }

  if (data.firstName !== undefined && data.firstName.trim() === '') {
    throw new Error('First name cannot be empty');
  }

  if (data.lastName !== undefined && data.lastName.trim() === '') {
    throw new Error('Last name cannot be empty');
  }

  const success = await employeeRepository.update(id, {
    firstName: data.firstName?.trim(),
    lastName: data.lastName?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    departmentId: data.departmentId,
    position: data.position?.trim(),
    hireDate: data.hireDate,
    employmentStatus: data.employmentStatus,
    salary: data.salary,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE',
      module: 'MASTER_DATA',
      recordType: 'employee',
      recordId: id,
      oldValues: {
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName,
        email: existingEmployee.email,
        departmentId: existingEmployee.departmentId,
        position: existingEmployee.position,
        employmentStatus: existingEmployee.employmentStatus,
      },
      newValues: data,
    });
  }

  return success;
};

export const deactivateEmployee = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const existingEmployee = await employeeRepository.findById(id);
  if (!existingEmployee) {
    throw new Error('Employee not found');
  }

  if (!existingEmployee.isActive) {
    throw new Error('Employee is already inactive');
  }

  const success = await employeeRepository.deactivate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'DEACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'employee',
      recordId: id,
    });
  }

  return success;
};

export const activateEmployee = async (
  id: number,
  updatedBy?: number
): Promise<boolean> => {
  const existingEmployee = await employeeRepository.findById(id);
  if (!existingEmployee) {
    throw new Error('Employee not found');
  }

  if (existingEmployee.isActive) {
    throw new Error('Employee is already active');
  }

  const success = await employeeRepository.activate(id, updatedBy);

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'ACTIVATE',
      module: 'MASTER_DATA',
      recordType: 'employee',
      recordId: id,
    });
  }

  return success;
};

export const deleteEmployee = async (
  id: number,
  deletedBy?: number
): Promise<boolean> => {
  const existingEmployee = await employeeRepository.findById(id);
  if (!existingEmployee) {
    throw new Error('Employee not found');
  }

  const success = await employeeRepository.deleteEmployee(id);

  if (success) {
    await auditLogRepository.create({
      userId: deletedBy,
      action: 'DELETE',
      module: 'MASTER_DATA',
      recordType: 'employee',
      recordId: id,
      oldValues: {
        employeeCode: existingEmployee.employeeCode,
        firstName: existingEmployee.firstName,
        lastName: existingEmployee.lastName,
      },
    });
  }

  return success;
};
