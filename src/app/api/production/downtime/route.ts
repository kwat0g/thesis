import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as downtimeService from '@/lib/services/production/downtimeService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.LOG_DOWNTIME');

    const body = await request.json();
    const { 
      workOrderId, 
      machineId, 
      downtimeStart, 
      downtimeEnd, 
      reason, 
      category, 
      notes 
    } = body;

    if (!workOrderId || !downtimeStart || !reason || !category) {
      return errorResponse('Work order, downtime start, reason, and category are required', 400);
    }

    if (!['breakdown', 'changeover', 'material_shortage', 'quality_issue', 'other'].includes(category)) {
      return errorResponse('Invalid category. Must be: breakdown, changeover, material_shortage, quality_issue, or other', 400);
    }

    const downtimeId = await downtimeService.logDowntime(
      {
        workOrderId,
        machineId,
        downtimeStart: new Date(downtimeStart),
        downtimeEnd: downtimeEnd ? new Date(downtimeEnd) : undefined,
        reason,
        category,
        notes,
      },
      user.userId
    );

    const downtime = await downtimeService.getDowntimeById(downtimeId);

    return successResponse(downtime, 'Downtime logged successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Log downtime error:', error);
    return serverErrorResponse(error.message || 'Failed to log downtime');
  }
}

