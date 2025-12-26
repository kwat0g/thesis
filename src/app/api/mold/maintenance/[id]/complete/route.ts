import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldMaintenanceService from '@/lib/services/mold/moldMaintenanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.COMPLETE_MAINTENANCE');

    const id = parseInt(params.id);
    const body = await request.json();
    const { durationHours, workPerformed, partsReplaced, findings, recommendations, nextMaintenanceShots } = body;

    if (durationHours === undefined || !workPerformed) {
      return errorResponse('Duration hours and work performed are required', 400);
    }

    const success = await moldMaintenanceService.completeMaintenanceRecord(
      id,
      {
        durationHours: parseFloat(durationHours),
        workPerformed,
        partsReplaced,
        findings,
        recommendations,
        nextMaintenanceShots: nextMaintenanceShots ? parseInt(nextMaintenanceShots) : undefined,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to complete mold maintenance record', 400);
    }

    const record = await moldMaintenanceService.getMaintenanceById(id);

    return successResponse(record, 'Mold maintenance record completed successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Complete mold maintenance record error:', error);
    return serverErrorResponse(error.message || 'Failed to complete mold maintenance record');
  }
}
