import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apInvoiceService from '@/lib/services/accounting/apInvoiceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_REPORTS');

    const supplierId = parseInt(params.supplierId);
    const balance = await apInvoiceService.getSupplierBalance(supplierId);

    return successResponse(balance);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get supplier balance error:', error);
    return serverErrorResponse('Failed to retrieve supplier balance');
  }
}
