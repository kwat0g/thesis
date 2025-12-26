import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as maintenanceWorkOrderService from '@/lib/services/maintenance/maintenanceWorkOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.VIEW_WORK_ORDERS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const machineId = searchParams.get('machineId');
    const maintenanceType = searchParams.get('maintenanceType');
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');
    const priority = searchParams.get('priority');
    const technicianId = searchParams.get('technicianId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      machineId: machineId ? parseInt(machineId) : undefined,
      maintenanceType: maintenanceType || undefined,
      status: status || undefined,
      approvalStatus: approvalStatus || undefined,
      priority: priority || undefined,
      technicianId: technicianId ? parseInt(technicianId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await maintenanceWorkOrderService.getWorkOrdersPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get maintenance work orders error:', error);
    return serverErrorResponse('Failed to retrieve maintenance work orders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MAINT.CREATE_WORK_ORDER');

    const body = await request.json();
    const { machineId, maintenanceScheduleId, productionDowntimeId, maintenanceType, priority, problemDescription, estimatedDurationHours, notes } = body;

    if (!machineId || !maintenanceType || !problemDescription) {
      return errorResponse('Machine, maintenance type, and problem description are required', 400);
    }

    const mwoId = await maintenanceWorkOrderService.createWorkOrder(
      {
        machineId: parseInt(machineId),
        maintenanceScheduleId: maintenanceScheduleId ? parseInt(maintenanceScheduleId) : undefined,
        productionDowntimeId: productionDowntimeId ? parseInt(productionDowntimeId) : undefined,
        maintenanceType,
        priority,
        problemDescription,
        estimatedDurationHours: estimatedDurationHours ? parseFloat(estimatedDurationHours) : undefined,
        notes,
      },
      user.userId
    );

    const mwo = await maintenanceWorkOrderService.getWorkOrderById(mwoId);

    return successResponse(mwo, 'Maintenance work order created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create maintenance work order error:', error);
    return serverErrorResponse(error.message || 'Failed to create maintenance work order');
  }
}

