import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionOrderService from '@/lib/services/production/productionOrderService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.APPROVE_ORDER');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid production order ID', 400);
    }

    const body = await request.json();
    const { reason } = body;

    const success = await productionOrderService.rejectProductionOrder(id, user.userId, reason);

    if (!success) {
      return notFoundResponse('Production order not found');
    }

    const productionOrder = await productionOrderService.getProductionOrderById(id);

    return successResponse(productionOrder, 'Production order rejected');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Production order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only pending')) {
      return errorResponse(error.message, 400);
    }
    console.error('Reject production order error:', error);
    return serverErrorResponse(error.message || 'Failed to reject production order');
  }
}
