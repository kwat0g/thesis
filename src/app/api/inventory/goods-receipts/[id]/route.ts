import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as inventoryReceivingService from '@/lib/services/inventory/inventoryReceivingService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.VIEW_RECEIPTS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid goods receipt ID', 400);
    }

    const gr = await inventoryReceivingService.getGRById(id);

    if (!gr) {
      return notFoundResponse('Goods receipt not found');
    }

    const lines = await inventoryReceivingService.getGRLines(id);

    return successResponse({ ...gr, lines });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get goods receipt error:', error);
    return serverErrorResponse('Failed to retrieve goods receipt');
  }
}
