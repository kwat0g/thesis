import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as payrollService from '@/lib/services/hr/payrollService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.VIEW_PAYROLL');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      status: status || undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const periods = await payrollService.getAllPeriods(filters);

    return successResponse(periods);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get payroll periods error:', error);
    return serverErrorResponse('Failed to retrieve payroll periods');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.CREATE_PAYROLL');

    const body = await request.json();
    const { periodStart, periodEnd, paymentDate } = body;

    if (!periodStart || !periodEnd || !paymentDate) {
      return errorResponse('Period start, end, and payment date are required', 400);
    }

    const periodId = await payrollService.createPeriod(
      {
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        paymentDate: new Date(paymentDate),
      },
      user.userId
    );

    const period = await payrollService.getPeriodById(periodId);

    return successResponse(period, 'Payroll period created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create payroll period error:', error);
    return serverErrorResponse(error.message || 'Failed to create payroll period');
  }
}

