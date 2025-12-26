import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as mrpService from '@/lib/services/mrp/mrpService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MRP.VIEW_RUNS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid MRP run ID', 400);
    }

    const mrpRun = await mrpService.getMRPRunById(id);

    if (!mrpRun) {
      return notFoundResponse('MRP run not found');
    }

    return successResponse(mrpRun);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get MRP run error:', error);
    return serverErrorResponse('Failed to retrieve MRP run');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MRP.EXECUTE_MRP');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid MRP run ID', 400);
    }

    const success = await mrpService.deleteMRPRun(id, user.userId);

    if (!success) {
      return notFoundResponse('MRP run not found');
    }

    return successResponse(null, 'MRP run deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'MRP run not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Cannot delete')) {
      return errorResponse(error.message, 400);
    }
    console.error('Delete MRP run error:', error);
    return serverErrorResponse(error.message || 'Failed to delete MRP run');
  }
}
