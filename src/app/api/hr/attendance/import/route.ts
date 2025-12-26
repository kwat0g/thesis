import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as attendanceService from '@/lib/services/hr/attendanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'HR.IMPORT_ATTENDANCE');

    const body = await request.json();
    const { records, importedFrom } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return errorResponse('Records array is required', 400);
    }

    if (!importedFrom) {
      return errorResponse('Import source is required', 400);
    }

    const result = await attendanceService.importBiometricAttendance(
      records.map((r: any) => ({
        employeeId: parseInt(r.employeeId),
        attendanceDate: new Date(r.attendanceDate),
        timeIn: r.timeIn ? new Date(r.timeIn) : undefined,
        timeOut: r.timeOut ? new Date(r.timeOut) : undefined,
        notes: r.notes,
      })),
      importedFrom,
      user.userId
    );

    return successResponse(result, 'Biometric attendance imported successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Import attendance error:', error);
    return serverErrorResponse(error.message || 'Failed to import attendance');
  }
}

