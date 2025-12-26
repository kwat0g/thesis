import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as apPaymentService from '@/lib/services/accounting/apPaymentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'AP.VIEW_REPORTS');

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const summary = await apPaymentService.getPaymentSummary(filters);

    return successResponse(summary);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get payment summary error:', error);
    return serverErrorResponse('Failed to retrieve payment summary');
  }
}

