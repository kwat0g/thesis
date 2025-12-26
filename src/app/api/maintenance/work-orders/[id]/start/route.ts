import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceWorkOrderService from '@/lib/services/maintenance/maintenanceWorkOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.EXECUTE_WORK_ORDER');

    const id = parseInt(params.id);
    const success = await maintenanceWorkOrderService.startWorkOrder(id, user.userId);

    if (!success) {
      return errorResponse('Failed to start maintenance work order', 400);
    }

    const mwo = await maintenanceWorkOrderService.getWorkOrderById(id);

    return successResponse(mwo, 'Maintenance work order started successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Start maintenance work order error:', error);
    return serverErrorResponse(error.message || 'Failed to start maintenance work order');
  }
}
