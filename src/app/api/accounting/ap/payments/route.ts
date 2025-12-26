import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apPaymentService from '@/lib/services/accounting/apPaymentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_PAYMENTS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const invoiceId = searchParams.get('invoiceId');
    const paymentMethod = searchParams.get('paymentMethod');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      invoiceId: invoiceId ? parseInt(invoiceId) : undefined,
      paymentMethod: paymentMethod || undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await apPaymentService.getPaymentsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get AP payments error:', error);
    return serverErrorResponse('Failed to retrieve AP payments');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.CREATE_PAYMENT');

    const body = await request.json();
    const { invoiceId, paymentDate, paymentAmount, paymentMethod, referenceNumber, notes } = body;

    if (!invoiceId || !paymentDate || !paymentAmount || !paymentMethod) {
      return errorResponse('Invoice, payment date, amount, and method are required', 400);
    }

    const paymentId = await apPaymentService.createPayment(
      {
        invoiceId: parseInt(invoiceId),
        paymentDate: new Date(paymentDate),
        paymentAmount: parseFloat(paymentAmount),
        paymentMethod,
        referenceNumber,
        notes,
      },
      user.userId
    );

    const payment = await apPaymentService.getPaymentById(paymentId);

    return successResponse(payment, 'AP payment created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create AP payment error:', error);
    return serverErrorResponse(error.message || 'Failed to create AP payment');
  }
}

