import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as inventoryReceivingService from '@/lib/services/inventory/inventoryReceivingService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.VIEW_RECEIPTS');

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

    const result = await inventoryReceivingService.getGRsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get goods receipts error:', error);
    return serverErrorResponse('Failed to retrieve goods receipts');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.CREATE_RECEIPT');

    const body = await request.json();
    const { poId, receiptDate, warehouseId, receiverId, lines, notes } = body;

    if (!poId || !receiptDate || !warehouseId || !receiverId || !lines) {
      return errorResponse('PO, receipt date, warehouse, receiver, and lines are required', 400);
    }

    const grId = await inventoryReceivingService.createGoodsReceipt(
      {
        poId,
        receiptDate: new Date(receiptDate),
        warehouseId,
        receiverId,
        lines,
        notes,
      },
      user.userId
    );

    const gr = await inventoryReceivingService.getGRById(grId);

    return successResponse(gr, 'Goods receipt created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create goods receipt error:', error);
    return serverErrorResponse(error.message || 'Failed to create goods receipt');
  }
}

