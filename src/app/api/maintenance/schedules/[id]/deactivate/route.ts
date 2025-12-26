import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceScheduleService from '@/lib/services/maintenance/maintenanceScheduleService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.UPDATE_SCHEDULE');

    const id = parseInt(params.id);
    const success = await maintenanceScheduleService.deactivateSchedule(id, user.userId);

    if (!success) {
      return errorResponse('Failed to deactivate maintenance schedule', 400);
    }

    const schedule = await maintenanceScheduleService.getScheduleById(id);

    return successResponse(schedule, 'Maintenance schedule deactivated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Deactivate maintenance schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to deactivate maintenance schedule');
  }
}
