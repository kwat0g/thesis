import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldMaintenanceService from '@/lib/services/mold/moldMaintenanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.VIEW_MAINTENANCE');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const moldId = searchParams.get('moldId');
    const maintenanceType = searchParams.get('maintenanceType');
    const status = searchParams.get('status');
    const technicianId = searchParams.get('technicianId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      moldId: moldId ? parseInt(moldId) : undefined,
      maintenanceType: maintenanceType || undefined,
      status: status || undefined,
      technicianId: technicianId ? parseInt(technicianId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await moldMaintenanceService.getMaintenancePaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get mold maintenance records error:', error);
    return serverErrorResponse('Failed to retrieve mold maintenance records');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MOLD.CREATE_MAINTENANCE');

    const body = await request.json();
    const { 
      moldId, 
      maintenanceWorkOrderId, 
      maintenanceType, 
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

    if (!moldId || !maintenanceType || !maintenanceDate || !workPerformed) {
      return errorResponse('Mold ID, maintenance type, date, and work performed are required', 400);
    }

    const recordId = await moldMaintenanceService.createMaintenanceRecord(
      {
        moldId: parseInt(moldId),
        maintenanceWorkOrderId: maintenanceWorkOrderId ? parseInt(maintenanceWorkOrderId) : undefined,
        maintenanceType,
        maintenanceDate: new Date(maintenanceDate),
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

    const record = await moldMaintenanceService.getMaintenanceById(recordId);

    return successResponse(record, 'Mold maintenance record created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create mold maintenance record error:', error);
    return serverErrorResponse(error.message || 'Failed to create mold maintenance record');
  }
}

