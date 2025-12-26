import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apPaymentService from '@/lib/services/accounting/apPaymentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_PAYMENTS');

    const invoiceId = parseInt(params.invoiceId);
    const history = await apPaymentService.getInvoicePaymentHistory(invoiceId);

    return successResponse(history);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get invoice payment history error:', error);
    return serverErrorResponse(error.message || 'Failed to retrieve invoice payment history');
  }
}
