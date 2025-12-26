import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as purchaseOrderService from '@/lib/services/purchasing/purchaseOrderService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.APPROVE_PO');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase order ID', 400);
    }

    const body = await request.json();
    const { reason } = body;

    const success = await purchaseOrderService.rejectPO(id, user.userId, reason);

    if (!success) {
      return notFoundResponse('Purchase order not found');
    }

    const po = await purchaseOrderService.getPOById(id);

    return successResponse(po, 'Purchase order rejected');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Purchase order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only pending') || error.message.includes('Cannot reject')) {
      return errorResponse(error.message, 400);
    }
    console.error('Reject purchase order error:', error);
    return serverErrorResponse(error.message || 'Failed to reject purchase order');
  }
}
