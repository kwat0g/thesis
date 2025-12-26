import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as inventoryIssuanceService from '@/lib/services/inventory/inventoryIssuanceService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.VIEW_ISSUES');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid goods issue ID', 400);
    }

    const gi = await inventoryIssuanceService.getGIById(id);

    if (!gi) {
      return notFoundResponse('Goods issue not found');
    }

    const lines = await inventoryIssuanceService.getGILines(id);

    return successResponse({ ...gi, lines });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get goods issue error:', error);
    return serverErrorResponse('Failed to retrieve goods issue');
  }
}
