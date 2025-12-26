import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldMaintenanceService from '@/lib/services/mold/moldMaintenanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.VIEW_MAINTENANCE');

    const id = parseInt(params.id);
    const record = await moldMaintenanceService.getMaintenanceById(id);

    if (!record) {
      return errorResponse('Mold maintenance record not found', 404);
    }

    return successResponse(record);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get mold maintenance record error:', error);
    return serverErrorResponse('Failed to retrieve mold maintenance record');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.UPDATE_MAINTENANCE');

    const id = parseInt(params.id);
    const body = await request.json();
    const { 
      maintenanceDate, 
      technicianId, 
      durationHours, 
      workPerformed, 
      partsReplaced, 
      findings, 
      recommendations, 
      nextMaintenanceShots, 
      status 
    } = body;

    const success = await moldMaintenanceService.updateMaintenanceRecord(
      id,
      {
        maintenanceDate: maintenanceDate ? new Date(maintenanceDate) : undefined,
        technicianId: technicianId ? parseInt(technicianId) : undefined,
        durationHours: durationHours ? parseFloat(durationHours) : undefined,
        workPerformed,
        partsReplaced,
        findings,
        recommendations,
        nextMaintenanceShots: nextMaintenanceShots ? parseInt(nextMaintenanceShots) : undefined,
        status,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to update mold maintenance record', 400);
    }

    const record = await moldMaintenanceService.getMaintenanceById(id);

    return successResponse(record, 'Mold maintenance record updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Update mold maintenance record error:', error);
    return serverErrorResponse(error.message || 'Failed to update mold maintenance record');
  }
}
