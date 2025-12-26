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
    const body = await request.json();
    const { workPerformed, rootCause, correctiveAction, actualDurationHours, partsReplaced, findings, recommendations, nextActionRequired } = body;

    if (!workPerformed || actualDurationHours === undefined) {
      return errorResponse('Work performed and actual duration are required', 400);
    }

    const success = await maintenanceWorkOrderService.completeWorkOrder(
      id,
      {
        workPerformed,
        rootCause,
        correctiveAction,
        actualDurationHours: parseFloat(actualDurationHours),
        partsReplaced,
        findings,
        recommendations,
        nextActionRequired,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to complete maintenance work order', 400);
    }

    const mwo = await maintenanceWorkOrderService.getWorkOrderById(id);

    return successResponse(mwo, 'Maintenance work order completed successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Complete maintenance work order error:', error);
    return serverErrorResponse(error.message || 'Failed to complete maintenance work order');
  }
}
