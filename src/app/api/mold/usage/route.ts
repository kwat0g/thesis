import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldUsageService from '@/lib/services/mold/moldUsageService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.START_USAGE');

    const body = await request.json();
    const { moldId, workOrderId, notes } = body;

    if (!moldId || !workOrderId) {
      return errorResponse('Mold ID and Work Order ID are required', 400);
    }

    const usageId = await moldUsageService.startMoldUsage(
      {
        moldId: parseInt(moldId),
        workOrderId: parseInt(workOrderId),
        notes,
      },
      user.userId
    );

    const usage = await moldUsageService.getUsageById(usageId);

    return successResponse(usage, 'Mold usage started successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Start mold usage error:', error);
    return serverErrorResponse(error.message || 'Failed to start mold usage');
  }
}

