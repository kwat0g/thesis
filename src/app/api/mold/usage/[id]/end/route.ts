import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldUsageService from '@/lib/services/mold/moldUsageService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.END_USAGE');

    const id = parseInt(params.id);
    const body = await request.json();
    const { shotsProduced, notes } = body;

    if (shotsProduced === undefined) {
      return errorResponse('Shots produced is required', 400);
    }

    const success = await moldUsageService.endMoldUsage(
      id,
      {
        shotsProduced: parseInt(shotsProduced),
        notes,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to end mold usage', 400);
    }

    const usage = await moldUsageService.getUsageById(id);

    return successResponse(usage, 'Mold usage ended successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('End mold usage error:', error);
    return serverErrorResponse(error.message || 'Failed to end mold usage');
  }
}
