import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceHistoryService from '@/lib/services/maintenance/maintenanceHistoryService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_HISTORY');

    const id = parseInt(params.id);
    const history = await maintenanceHistoryService.getHistoryById(id);

    if (!history) {
      return errorResponse('Maintenance history not found', 404);
    }

    return successResponse(history);
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
