import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as attendanceService from '@/lib/services/hr/attendanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.VIEW_ATTENDANCE');

    const id = parseInt(params.id);
    const attendance = await attendanceService.getAttendanceById(id);

    if (!attendance) {
      return errorResponse('Attendance record not found', 404);
    }

    return successResponse(attendance);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get attendance error:', error);
    return serverErrorResponse('Failed to retrieve attendance record');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.UPDATE_ATTENDANCE');

    const id = parseInt(params.id);
    const body = await request.json();
    const { shiftId, timeIn, timeOut, hoursWorked, overtimeHours, status, notes } = body;

    const success = await attendanceService.updateAttendance(
      id,
      {
        shiftId: shiftId ? parseInt(shiftId) : undefined,
        timeIn: timeIn ? new Date(timeIn) : undefined,
        timeOut: timeOut ? new Date(timeOut) : undefined,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : undefined,
        overtimeHours: overtimeHours ? parseFloat(overtimeHours) : undefined,
        status,
        notes,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to update attendance record', 400);
    }

    const attendance = await attendanceService.getAttendanceById(id);

    return successResponse(attendance, 'Attendance updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Update attendance error:', error);
    return serverErrorResponse(error.message || 'Failed to update attendance');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.DELETE_ATTENDANCE');

    const id = parseInt(params.id);
    const success = await attendanceService.deleteAttendance(id, user.userId);

    if (!success) {
      return errorResponse('Failed to delete attendance record', 400);
    }

    return successResponse(null, 'Attendance deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Delete attendance error:', error);
    return serverErrorResponse(error.message || 'Failed to delete attendance');
  }
}
