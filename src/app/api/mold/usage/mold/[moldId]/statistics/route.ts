import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldUsageService from '@/lib/services/mold/moldUsageService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { moldId: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.VIEW');

    const moldId = parseInt(params.moldId);
    const statistics = await moldUsageService.getMoldUsageStatistics(moldId);

    return successResponse(statistics);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get mold usage statistics error:', error);
    return serverErrorResponse('Failed to retrieve mold usage statistics');
  }
}
