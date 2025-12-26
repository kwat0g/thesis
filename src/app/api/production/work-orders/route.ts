import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as workOrderService from '@/lib/services/production/workOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.VIEW_WORK_ORDERS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const machineId = searchParams.get('machineId');
    const supervisorId = searchParams.get('supervisorId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      status: status || undefined,
      machineId: machineId ? parseInt(machineId) : undefined,
      supervisorId: supervisorId ? parseInt(supervisorId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await workOrderService.getWorkOrdersPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get work orders error:', error);
    return serverErrorResponse('Failed to retrieve work orders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.CREATE_WORK_ORDER');

    const body = await request.json();
    const { productionOrderId, productionScheduleId, quantityPlanned, machineId, moldId, supervisorId, notes } = body;

    if (!productionOrderId || !quantityPlanned) {
      return errorResponse('Production order and quantity planned are required', 400);
    }

    const woId = await workOrderService.createWorkOrder(
      {
        productionOrderId,
        productionScheduleId,
        quantityPlanned: parseFloat(quantityPlanned),
        machineId,
        moldId,
        supervisorId,
        notes,
      },
      user.userId
    );

    const wo = await workOrderService.getWorkOrderById(woId);

    return successResponse(wo, 'Work order created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create work order error:', error);
    return serverErrorResponse(error.message || 'Failed to create work order');
  }
}

