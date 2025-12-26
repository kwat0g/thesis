import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionPlanningService from '@/lib/services/production/productionPlanningService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.VIEW_SCHEDULES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const machineId = searchParams.get('machineId');

    const filters = {
      status: status || undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      machineId: machineId ? parseInt(machineId) : undefined,
    };

    const result = await productionPlanningService.getSchedulesPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get production schedules error:', error);
    return serverErrorResponse('Failed to retrieve production schedules');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.MANAGE_SCHEDULES');

    const body = await request.json();
    const { productionOrderId, scheduledDate, scheduledQuantity, machineId, shiftId } = body;

    if (!productionOrderId || !scheduledDate || !scheduledQuantity) {
      return errorResponse('Production order, scheduled date, and quantity are required', 400);
    }

    const scheduleId = await productionPlanningService.createSchedule(
      {
        productionOrderId,
        scheduledDate: new Date(scheduledDate),
        scheduledQuantity: parseFloat(scheduledQuantity),
        machineId,
        shiftId,
      },
      user.userId
    );

    const schedule = await productionPlanningService.getScheduleById(scheduleId);

    return successResponse(schedule, 'Production schedule created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create production schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to create production schedule');
  }
}

