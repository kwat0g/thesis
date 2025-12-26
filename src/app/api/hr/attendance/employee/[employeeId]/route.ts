import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as attendanceService from '@/lib/services/hr/attendanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.VIEW_ATTENDANCE');

    const employeeId = parseInt(params.employeeId);
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const status = searchParams.get('status');

    const filters = {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      status: status || undefined,
    };

    const attendance = await attendanceService.getAttendanceByEmployee(employeeId, filters);

    return successResponse(attendance);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get employee attendance error:', error);
    return serverErrorResponse('Failed to retrieve employee attendance');
  }
}
