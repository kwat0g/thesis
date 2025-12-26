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
    const record = await payrollService.getPayrollRecord(id);

    if (!record) {
      return errorResponse('Payroll record not found', 404);
    }

    return successResponse(record);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get payroll record error:', error);
    return serverErrorResponse('Failed to retrieve payroll record');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.UPDATE_PAYROLL');

    const id = parseInt(params.id);
    const body = await request.json();
    const { basicSalary, overtimePay, allowances, deductions, notes } = body;

    const success = await payrollService.updatePayrollRecord(
      id,
      {
        basicSalary: basicSalary ? parseFloat(basicSalary) : undefined,
        overtimePay: overtimePay ? parseFloat(overtimePay) : undefined,
        allowances: allowances ? parseFloat(allowances) : undefined,
        deductions: deductions ? parseFloat(deductions) : undefined,
        notes,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to update payroll record', 400);
    }

    const record = await payrollService.getPayrollRecord(id);

    return successResponse(record, 'Payroll record updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Update payroll record error:', error);
    return serverErrorResponse(error.message || 'Failed to update payroll record');
  }
}
