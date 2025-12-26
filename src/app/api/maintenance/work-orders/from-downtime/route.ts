import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceWorkOrderService from '@/lib/services/maintenance/maintenanceWorkOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.CREATE_WORK_ORDER');

    const body = await request.json();
    const { downtimeId, priority, estimatedDurationHours, notes } = body;

    if (!downtimeId) {
      return errorResponse('Downtime ID is required', 400);
    }

    const mwoId = await maintenanceWorkOrderService.createWorkOrderFromDowntime(
      parseInt(downtimeId),
      {
        priority,
        estimatedDurationHours: estimatedDurationHours ? parseFloat(estimatedDurationHours) : undefined,
        notes,
      },
      user.userId
    );

    const mwo = await maintenanceWorkOrderService.getWorkOrderById(mwoId);

    return successResponse(mwo, 'Maintenance work order created from downtime successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create maintenance work order from downtime error:', error);
    return serverErrorResponse(error.message || 'Failed to create maintenance work order from downtime');
  }
}

