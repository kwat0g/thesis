import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apInvoiceService from '@/lib/services/accounting/apInvoiceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.APPROVE_INVOICE');

    const id = parseInt(params.id);
    const success = await apInvoiceService.approveInvoice(id, user.userId);

    if (!success) {
      return errorResponse('Failed to approve AP invoice', 400);
    }

    const invoice = await apInvoiceService.getInvoiceById(id);

    return successResponse(invoice, 'AP invoice approved successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Approve AP invoice error:', error);
    return serverErrorResponse(error.message || 'Failed to approve AP invoice');
  }
}
