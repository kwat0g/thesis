import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceHistoryService from '@/lib/services/maintenance/maintenanceHistoryService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_HISTORY');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const machineId = searchParams.get('machineId');
    const maintenanceType = searchParams.get('maintenanceType');
    const technicianId = searchParams.get('technicianId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const nextActionRequired = searchParams.get('nextActionRequired');

    const filters = {
      machineId: machineId ? parseInt(machineId) : undefined,
      maintenanceType: maintenanceType || undefined,
      technicianId: technicianId ? parseInt(technicianId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      nextActionRequired: nextActionRequired !== null ? nextActionRequired === 'true' : undefined,
    };

    const result = await maintenanceHistoryService.getHistoryPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get maintenance history error:', error);
    return serverErrorResponse('Failed to retrieve maintenance history');
  }
}

