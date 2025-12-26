import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as departmentService from '@/lib/services/master-data/departmentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.VIEW_DEPARTMENTS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const result = await departmentService.getDepartmentsPaginated(page, pageSize, isActive);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get departments error:', error);
    return serverErrorResponse('Failed to retrieve departments');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_DEPARTMENTS');

    const body = await request.json();
    const { deptCode, deptName, description, managerId } = body;

    if (!deptCode || !deptName) {
      return errorResponse('Department code and name are required', 400);
    }

    const deptId = await departmentService.createDepartment(
      {
        deptCode,
        deptName,
        description,
        managerId,
      },
      user.userId
    );

    const department = await departmentService.getDepartmentById(deptId);

    return successResponse(department, 'Department created successfully');
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
    console.error('Create department error:', error);
    return serverErrorResponse(error.message || 'Failed to create department');
  }
}

