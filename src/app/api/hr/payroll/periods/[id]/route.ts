import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as payrollService from '@/lib/services/hr/payrollService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.VIEW_PAYROLL');

    const id = parseInt(params.id);
    const period = await payrollService.getPeriodById(id);

    if (!period) {
      return errorResponse('Payroll period not found', 404);
    }

    return successResponse(period);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get payroll period error:', error);
    return serverErrorResponse('Failed to retrieve payroll period');
  }
}
