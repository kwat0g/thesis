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

    if (!fromDate || !toDate) {
      return errorResponse('From date and to date are required', 400);
    }

    const summary = await attendanceService.getAttendanceSummary(
      employeeId,
      new Date(fromDate),
      new Date(toDate)
    );

    return successResponse(summary);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get attendance summary error:', error);
    return serverErrorResponse('Failed to retrieve attendance summary');
  }
}
