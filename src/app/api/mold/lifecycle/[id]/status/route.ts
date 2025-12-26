import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldLifecycleService from '@/lib/services/mold/moldLifecycleService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.UPDATE_STATUS');

    const id = parseInt(params.id);
    const body = await request.json();
    const { status, reason, conditionNotes } = body;

    if (!status) {
      return errorResponse('Status is required', 400);
    }

    const validStatuses = ['available', 'in_use', 'maintenance', 'repair', 'retired'];
    if (!validStatuses.includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    const success = await moldLifecycleService.updateMoldStatus(
      id,
      status,
      reason,
      conditionNotes,
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to update mold status', 400);
    }

    const mold = await moldLifecycleService.getMoldById(id);

    return successResponse(mold, 'Mold status updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Update mold status error:', error);
    return serverErrorResponse(error.message || 'Failed to update mold status');
  }
}
