import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as attendanceService from '@/lib/services/hr/attendanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.VIEW_ATTENDANCE');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const employeeId = searchParams.get('employeeId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    const filters = {
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      status: status || undefined,
      source: source || undefined,
    };

    const result = await attendanceService.getAttendancePaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get attendance error:', error);
    return serverErrorResponse('Failed to retrieve attendance records');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.RECORD_ATTENDANCE');

    const body = await request.json();
    const { employeeId, attendanceDate, shiftId, timeIn, timeOut, hoursWorked, overtimeHours, status, source, notes } = body;

    if (!employeeId || !attendanceDate) {
      return errorResponse('Employee ID and attendance date are required', 400);
    }

    const attendanceId = await attendanceService.recordAttendance(
      {
        employeeId: parseInt(employeeId),
        attendanceDate: new Date(attendanceDate),
        shiftId: shiftId ? parseInt(shiftId) : undefined,
        timeIn: timeIn ? new Date(timeIn) : undefined,
        timeOut: timeOut ? new Date(timeOut) : undefined,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : undefined,
        overtimeHours: overtimeHours ? parseFloat(overtimeHours) : undefined,
        status,
        source,
        notes,
      },
      user.userId
    );

    const attendance = await attendanceService.getAttendanceById(attendanceId);

    return successResponse(attendance, 'Attendance recorded successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Record attendance error:', error);
    return serverErrorResponse(error.message || 'Failed to record attendance');
  }
}

