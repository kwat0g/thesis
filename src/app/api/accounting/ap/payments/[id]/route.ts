import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apPaymentService from '@/lib/services/accounting/apPaymentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_PAYMENTS');

    const id = parseInt(params.id);
    const payment = await apPaymentService.getPaymentById(id);

    if (!payment) {
      return errorResponse('AP payment not found', 404);
    }

    return successResponse(payment);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get AP payment error:', error);
    return serverErrorResponse('Failed to retrieve AP payment');
  }
}
