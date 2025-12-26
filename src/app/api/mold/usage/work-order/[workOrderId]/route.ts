import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldUsageService from '@/lib/services/mold/moldUsageService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { workOrderId: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.VIEW');

    const workOrderId = parseInt(params.workOrderId);
    const usage = await moldUsageService.getUsageByWorkOrder(workOrderId);

    if (!usage) {
      return errorResponse('No mold usage found for this work order', 404);
    }

    return successResponse(usage);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get work order mold usage error:', error);
    return serverErrorResponse('Failed to retrieve work order mold usage');
  }
}
