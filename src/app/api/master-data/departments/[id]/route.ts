import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as departmentService from '@/lib/services/master-data/departmentService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.VIEW_DEPARTMENTS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid department ID', 400);
    }

    const department = await departmentService.getDepartmentById(id);

    if (!department) {
      return notFoundResponse('Department not found');
    }

    return successResponse(department);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get department error:', error);
    return serverErrorResponse('Failed to retrieve department');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_DEPARTMENTS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid department ID', 400);
    }

    const body = await request.json();
    const { deptName, description, managerId } = body;

    const success = await departmentService.updateDepartment(
      id,
      {
        deptName,
        description,
        managerId,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('Department not found');
    }

    const department = await departmentService.getDepartmentById(id);

    return successResponse(department, 'Department updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Department not found') {
      return notFoundResponse(error.message);
    }
    console.error('Update department error:', error);
    return serverErrorResponse(error.message || 'Failed to update department');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_DEPARTMENTS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid department ID', 400);
    }

    const success = await departmentService.deleteDepartment(id, user.userId);

    if (!success) {
      return notFoundResponse('Department not found');
    }

    return successResponse(null, 'Department deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Department not found') {
      return notFoundResponse(error.message);
    }
    console.error('Delete department error:', error);
    return serverErrorResponse(error.message || 'Failed to delete department');
  }
}
