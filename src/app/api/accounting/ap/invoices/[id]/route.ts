import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apInvoiceService from '@/lib/services/accounting/apInvoiceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_INVOICES');

    const id = parseInt(params.id);
    const invoice = await apInvoiceService.getInvoiceById(id);

    if (!invoice) {
      return errorResponse('AP invoice not found', 404);
    }

    return successResponse(invoice);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get AP invoice error:', error);
    return serverErrorResponse('Failed to retrieve AP invoice');
  }
}
