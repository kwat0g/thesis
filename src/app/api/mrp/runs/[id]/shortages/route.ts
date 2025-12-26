import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as mrpService from '@/lib/services/mrp/mrpService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MRP.VIEW_REQUIREMENTS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid MRP run ID', 400);
    }

    const shortages = await mrpService.getMRPShortages(id);

    return successResponse(shortages);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get MRP shortages error:', error);
    return serverErrorResponse('Failed to retrieve MRP shortages');
  }
}
