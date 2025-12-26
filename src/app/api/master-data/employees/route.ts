import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as employeeService from '@/lib/services/master-data/employeeService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.VIEW_EMPLOYEES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const departmentId = searchParams.get('departmentId');
    const employmentStatus = searchParams.get('employmentStatus');

    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const filters = {
      isActive,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      employmentStatus: employmentStatus || undefined,
    };

    const result = await employeeService.getEmployeesPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get employees error:', error);
    return serverErrorResponse('Failed to retrieve employees');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_EMPLOYEES');

    const body = await request.json();
    const { 
      employeeCode, 
      firstName, 
      lastName, 
      email, 
      phone, 
      departmentId, 
      position, 
      hireDate, 
      employmentStatus, 
      salary 
    } = body;

    if (!employeeCode || !firstName || !lastName) {
      return errorResponse('Employee code, first name, and last name are required', 400);
    }

    const employeeId = await employeeService.createEmployee(
      {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        departmentId,
        position,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        employmentStatus,
        salary,
      },
      user.userId
    );

    const employee = await employeeService.getEmployeeById(employeeId);

    return successResponse(employee, 'Employee created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(error.message, 409);
    }
    console.error('Create employee error:', error);
    return serverErrorResponse(error.message || 'Failed to create employee');
  }
}

