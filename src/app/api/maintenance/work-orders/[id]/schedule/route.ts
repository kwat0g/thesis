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

    await requirePermission(user, 'MAINT.SCHEDULE_WORK_ORDER');

    const id = parseInt(params.id);
    const body = await request.json();
    const { scheduledDate, assignedTechnicianId } = body;

    if (!scheduledDate) {
      return errorResponse('Scheduled date is required', 400);
    }

    const success = await maintenanceWorkOrderService.scheduleWorkOrder(
      id,
      {
        scheduledDate: new Date(scheduledDate),
        assignedTechnicianId: assignedTechnicianId ? parseInt(assignedTechnicianId) : undefined,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to schedule maintenance work order', 400);
    }

    const mwo = await maintenanceWorkOrderService.getWorkOrderById(id);

    return successResponse(mwo, 'Maintenance work order scheduled successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Schedule maintenance work order error:', error);
    return serverErrorResponse(error.message || 'Failed to schedule maintenance work order');
  }
}
