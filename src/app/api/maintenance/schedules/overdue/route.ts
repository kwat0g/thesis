import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceScheduleService from '@/lib/services/maintenance/maintenanceScheduleService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_SCHEDULES');

    const schedules = await maintenanceScheduleService.getOverdueSchedules();

    return successResponse(schedules);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get overdue schedules error:', error);
    return serverErrorResponse('Failed to retrieve overdue schedules');
  }
}

