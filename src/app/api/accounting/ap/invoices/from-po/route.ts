import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apInvoiceService from '@/lib/services/accounting/apInvoiceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.CREATE_INVOICE');

    const body = await request.json();
    const { poId, supplierInvoiceNumber, invoiceDate, dueDate, notes } = body;

    if (!poId || !invoiceDate || !dueDate) {
      return errorResponse('PO ID, invoice date, and due date are required', 400);
    }

    const invoiceId = await apInvoiceService.createInvoiceFromPO(
      parseInt(poId),
      {
        supplierInvoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        notes,
      },
      user.userId
    );

    const invoice = await apInvoiceService.getInvoiceById(invoiceId);

    return successResponse(invoice, 'AP invoice created from PO successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create AP invoice from PO error:', error);
    return serverErrorResponse(error.message || 'Failed to create AP invoice from PO');
  }
}

