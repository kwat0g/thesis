import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldLifecycleService from '@/lib/services/mold/moldLifecycleService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.RETIRE');

    const id = parseInt(params.id);
    const body = await request.json();
    const { reason } = body;

    const success = await moldLifecycleService.retireMold(id, reason, user.userId);

    if (!success) {
      return errorResponse('Failed to retire mold', 400);
    }

    const mold = await moldLifecycleService.getMoldById(id);

    return successResponse(mold, 'Mold retired successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Retire mold error:', error);
    return serverErrorResponse(error.message || 'Failed to retire mold');
  }
}
