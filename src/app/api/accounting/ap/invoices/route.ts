import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apInvoiceService from '@/lib/services/accounting/apInvoiceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_INVOICES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const overdue = searchParams.get('overdue');

    const filters = {
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      status: status || undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      overdue: overdue === 'true',
    };

    const result = await apInvoiceService.getInvoicesPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get AP invoices error:', error);
    return serverErrorResponse('Failed to retrieve AP invoices');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.CREATE_INVOICE');

    const body = await request.json();
    const { supplierInvoiceNumber, supplierId, poId, invoiceDate, dueDate, totalAmount, paymentTerms, notes } = body;

    if (!supplierId || !invoiceDate || !dueDate || !totalAmount) {
      return errorResponse('Supplier, invoice date, due date, and total amount are required', 400);
    }

    const invoiceId = await apInvoiceService.createInvoice(
      {
        supplierInvoiceNumber,
        supplierId: parseInt(supplierId),
        poId: poId ? parseInt(poId) : undefined,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        totalAmount: parseFloat(totalAmount),
        paymentTerms,
        notes,
      },
      user.userId
    );

    const invoice = await apInvoiceService.getInvoiceById(invoiceId);

    return successResponse(invoice, 'AP invoice created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create AP invoice error:', error);
    return serverErrorResponse(error.message || 'Failed to create AP invoice');
  }
}

