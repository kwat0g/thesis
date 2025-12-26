import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as workOrderService from '@/lib/services/production/workOrderService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.VIEW_WORK_ORDERS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid work order ID', 400);
    }

    const wo = await workOrderService.getWorkOrderById(id);

    if (!wo) {
      return notFoundResponse('Work order not found');
    }

    return successResponse(wo);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get work order error:', error);
    return serverErrorResponse('Failed to retrieve work order');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.DELETE_WORK_ORDER');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid work order ID', 400);
    }

    const success = await workOrderService.deleteWorkOrder(id, user.userId);

    if (!success) {
      return notFoundResponse('Work order not found');
    }

    return successResponse(null, 'Work order deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Work order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only pending')) {
      return errorResponse(error.message, 400);
    }
    console.error('Delete work order error:', error);
    return serverErrorResponse(error.message || 'Failed to delete work order');
  }
}
