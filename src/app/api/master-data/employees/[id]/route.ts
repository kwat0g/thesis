import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as employeeService from '@/lib/services/master-data/employeeService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.VIEW_EMPLOYEES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid employee ID', 400);
    }

    const employee = await employeeService.getEmployeeById(id);

    if (!employee) {
      return notFoundResponse('Employee not found');
    }

    return successResponse(employee);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get employee error:', error);
    return serverErrorResponse('Failed to retrieve employee');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_EMPLOYEES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid employee ID', 400);
    }

    const body = await request.json();
    const { 
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

    const success = await employeeService.updateEmployee(
      id,
      {
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

    if (!success) {
      return notFoundResponse('Employee not found');
    }

    const employee = await employeeService.getEmployeeById(id);

    return successResponse(employee, 'Employee updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Employee not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(error.message, 409);
    }
    console.error('Update employee error:', error);
    return serverErrorResponse(error.message || 'Failed to update employee');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_EMPLOYEES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid employee ID', 400);
    }

    const success = await employeeService.deleteEmployee(id, user.userId);

    if (!success) {
      return notFoundResponse('Employee not found');
    }

    return successResponse(null, 'Employee deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Employee not found') {
      return notFoundResponse(error.message);
    }
    console.error('Delete employee error:', error);
    return serverErrorResponse(error.message || 'Failed to delete employee');
  }
}
