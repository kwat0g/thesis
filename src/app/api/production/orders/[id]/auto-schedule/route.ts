import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionPlanningService from '@/lib/services/production/productionPlanningService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.MANAGE_SCHEDULES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid production order ID', 400);
    }

    const body = await request.json();
    const { strategy } = body;

    if (strategy && !['daily', 'weekly'].includes(strategy)) {
      return errorResponse('Strategy must be either "daily" or "weekly"', 400);
    }

    const scheduleIds = await productionPlanningService.autoScheduleProductionOrder(
      id,
      strategy || 'daily',
      user.userId
    );

    return successResponse(
      { scheduleIds, count: scheduleIds.length },
      `Created ${scheduleIds.length} production schedules`
    );
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Auto-schedule production order error:', error);
    return serverErrorResponse(error.message || 'Failed to auto-schedule production order');
  }
}
