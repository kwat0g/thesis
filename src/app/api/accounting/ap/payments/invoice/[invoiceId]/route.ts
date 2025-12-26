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
    const payments = await apPaymentService.getPaymentsByInvoice(invoiceId);

    return successResponse(payments);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get invoice payments error:', error);
    return serverErrorResponse('Failed to retrieve invoice payments');
  }
}
