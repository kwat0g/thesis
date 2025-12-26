import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldMaintenanceService from '@/lib/services/mold/moldMaintenanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { moldId: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.VIEW_MAINTENANCE');

    const moldId = parseInt(params.moldId);
    const history = await moldMaintenanceService.getMoldMaintenanceHistory(moldId);

    return successResponse(history);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get mold maintenance history error:', error);
    return serverErrorResponse('Failed to retrieve mold maintenance history');
  }
}
