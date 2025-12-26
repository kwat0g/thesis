import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceScheduleService from '@/lib/services/maintenance/maintenanceScheduleService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_SCHEDULES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const machineId = searchParams.get('machineId');
    const maintenanceType = searchParams.get('maintenanceType');
    const isActive = searchParams.get('isActive');
    const dueSoon = searchParams.get('dueSoon');

    const filters = {
      machineId: machineId ? parseInt(machineId) : undefined,
      maintenanceType: maintenanceType || undefined,
      isActive: isActive !== null ? isActive === 'true' : undefined,
      dueSoon: dueSoon === 'true',
    };

    const result = await maintenanceScheduleService.getSchedulesPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get maintenance schedules error:', error);
    return serverErrorResponse('Failed to retrieve maintenance schedules');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.CREATE_SCHEDULE');

    const body = await request.json();
    const { machineId, maintenanceType, frequencyDays, nextMaintenanceDate, description, estimatedDurationHours, isActive } = body;

    if (!machineId || !maintenanceType || !frequencyDays || !nextMaintenanceDate) {
      return errorResponse('Machine, maintenance type, frequency, and next maintenance date are required', 400);
    }

    const scheduleId = await maintenanceScheduleService.createSchedule(
      {
        machineId: parseInt(machineId),
        maintenanceType,
        frequencyDays: parseInt(frequencyDays),
        nextMaintenanceDate: new Date(nextMaintenanceDate),
        description,
        estimatedDurationHours: estimatedDurationHours ? parseFloat(estimatedDurationHours) : undefined,
        isActive,
      },
      user.userId
    );

    const schedule = await maintenanceScheduleService.getScheduleById(scheduleId);

    return successResponse(schedule, 'Maintenance schedule created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create maintenance schedule error:', error);
    return serverErrorResponse(error.message || 'Failed to create maintenance schedule');
  }
}

