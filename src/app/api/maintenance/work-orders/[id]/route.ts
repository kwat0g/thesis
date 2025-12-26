import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceWorkOrderService from '@/lib/services/maintenance/maintenanceWorkOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_WORK_ORDERS');

    const id = parseInt(params.id);
    const mwo = await maintenanceWorkOrderService.getWorkOrderById(id);

    if (!mwo) {
      return errorResponse('Maintenance work order not found', 404);
    }

    return successResponse(mwo);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get maintenance work order error:', error);
    return serverErrorResponse('Failed to retrieve maintenance work order');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.DELETE_WORK_ORDER');

    const id = parseInt(params.id);
    const success = await maintenanceWorkOrderService.deleteWorkOrder(id, user.userId);

    if (!success) {
      return errorResponse('Failed to delete maintenance work order', 400);
    }

    return successResponse(null, 'Maintenance work order deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Delete maintenance work order error:', error);
    return serverErrorResponse(error.message || 'Failed to delete maintenance work order');
  }
}
