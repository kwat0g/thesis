import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as payrollService from '@/lib/services/hr/payrollService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.CLOSE_PAYROLL');

    const id = parseInt(params.id);
    const success = await payrollService.closePayroll(id, user.userId);

    if (!success) {
      return errorResponse('Failed to close payroll', 400);
    }

    const period = await payrollService.getPeriodById(id);

    return successResponse(period, 'Payroll closed successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Close payroll error:', error);
    return serverErrorResponse(error.message || 'Failed to close payroll');
  }
}
