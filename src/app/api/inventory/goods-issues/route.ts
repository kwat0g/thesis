import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as inventoryIssuanceService from '@/lib/services/inventory/inventoryIssuanceService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.VIEW_ISSUES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      status: status || undefined,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await inventoryIssuanceService.getGIsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get goods issues error:', error);
    return serverErrorResponse('Failed to retrieve goods issues');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.CREATE_ISSUE');

    const body = await request.json();
    const { productionOrderId, issueDate, warehouseId, issuedBy, lines, notes } = body;

    if (!productionOrderId || !issueDate || !warehouseId || !issuedBy || !lines) {
      return errorResponse('Production order, issue date, warehouse, issuer, and lines are required', 400);
    }

    const giId = await inventoryIssuanceService.createGoodsIssue(
      {
        productionOrderId,
        issueDate: new Date(issueDate),
        warehouseId,
        issuedBy,
        lines,
        notes,
      },
      user.userId
    );

    const gi = await inventoryIssuanceService.getGIById(giId);

    return successResponse(gi, 'Goods issue created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create goods issue error:', error);
    return serverErrorResponse(error.message || 'Failed to create goods issue');
  }
}

