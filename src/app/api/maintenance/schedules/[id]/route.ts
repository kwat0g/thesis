import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceScheduleService from '@/lib/services/maintenance/maintenanceScheduleService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_SCHEDULES');

    const id = parseInt(params.id);
    const schedule = await maintenanceScheduleService.getScheduleById(id);

    if (!schedule) {
      return errorResponse('Maintenance schedule not found', 404);
    }

    return successResponse(schedule);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get maintenance schedule error:', error);
    return serverErrorResponse('Failed to retrieve maintenance schedule');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.UPDATE_SCHEDULE');

    const id = parseInt(params.id);
    const body = await request.json();
    const { frequencyDays, lastMaintenanceDate, nextMaintenanceDate, description, estimatedDurationHours, isActive } = body;

    const success = await maintenanceScheduleService.updateSchedule(
      id,
      {
        frequencyDays: frequencyDays ? parseInt(frequencyDays) : undefined,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined,
        nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : undefined,
        description,
        estimatedDurationHours: estimatedDurationHours ? parseFloat(estimatedDurationHours) : undefined,
        isActive,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to update maintenance schedule', 400);
    }

    const schedule = await maintenanceScheduleService.getScheduleById(id);

    return successResponse(schedule, 'Maintenance schedule updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Update maintenance schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to update maintenance schedule');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.DELETE_SCHEDULE');

    const id = parseInt(params.id);
    const success = await maintenanceScheduleService.deleteSchedule(id, user.userId);

    if (!success) {
      return errorResponse('Failed to delete maintenance schedule', 400);
    }

    return successResponse(null, 'Maintenance schedule deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Delete maintenance schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to delete maintenance schedule');
  }
}
