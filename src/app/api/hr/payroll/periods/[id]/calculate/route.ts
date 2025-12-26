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

    await requirePermission(user, 'HR.CALCULATE_PAYROLL');

    const id = parseInt(params.id);
    const result = await payrollService.calculatePayroll(id, user.userId);

    const period = await payrollService.getPeriodById(id);

    return successResponse(
      { period, ...result },
      'Payroll calculated successfully'
    );
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Calculate payroll error:', error);
    return serverErrorResponse(error.message || 'Failed to calculate payroll');
  }
}
