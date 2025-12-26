import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionPlanningService from '@/lib/services/production/productionPlanningService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.VIEW_SCHEDULES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid schedule ID', 400);
    }

    const schedule = await productionPlanningService.getScheduleById(id);

    if (!schedule) {
      return notFoundResponse('Production schedule not found');
    }

    return successResponse(schedule);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get production schedule error:', error);
    return serverErrorResponse('Failed to retrieve production schedule');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.MANAGE_SCHEDULES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid schedule ID', 400);
    }

    const body = await request.json();
    const { scheduledDate, scheduledQuantity, machineId, shiftId } = body;

    const success = await productionPlanningService.updateSchedule(
      id,
      {
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledQuantity: scheduledQuantity ? parseFloat(scheduledQuantity) : undefined,
        machineId,
        shiftId,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('Production schedule not found');
    }

    const schedule = await productionPlanningService.getScheduleById(id);

    return successResponse(schedule, 'Production schedule updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Production schedule not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only scheduled')) {
      return errorResponse(error.message, 400);
    }
    console.error('Update production schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to update production schedule');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.MANAGE_SCHEDULES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid schedule ID', 400);
    }

    const success = await productionPlanningService.deleteSchedule(id, user.userId);

    if (!success) {
      return notFoundResponse('Production schedule not found');
    }

    return successResponse(null, 'Production schedule deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Production schedule not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only scheduled')) {
      return errorResponse(error.message, 400);
    }
    console.error('Delete production schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to delete production schedule');
  }
}
