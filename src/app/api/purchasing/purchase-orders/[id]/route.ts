import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as purchaseOrderService from '@/lib/services/purchasing/purchaseOrderService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.VIEW_PO');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase order ID', 400);
    }

    const po = await purchaseOrderService.getPOById(id);

    if (!po) {
      return notFoundResponse('Purchase order not found');
    }

    const lines = await purchaseOrderService.getPOLines(id);

    return successResponse({ ...po, lines });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get purchase order error:', error);
    return serverErrorResponse('Failed to retrieve purchase order');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.UPDATE_PO');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase order ID', 400);
    }

    const body = await request.json();
    const { supplierId, expectedDeliveryDate, notes } = body;

    const success = await purchaseOrderService.updatePO(
      id,
      {
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        notes,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('Purchase order not found');
    }

    const po = await purchaseOrderService.getPOById(id);

    return successResponse(po, 'Purchase order updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Purchase order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only draft')) {
      return errorResponse(error.message, 400);
    }
    console.error('Update purchase order error:', error);
    return serverErrorResponse(error.message || 'Failed to update purchase order');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.DELETE_PO');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase order ID', 400);
    }

    const success = await purchaseOrderService.deletePO(id, user.userId);

    if (!success) {
      return notFoundResponse('Purchase order not found');
    }

    return successResponse(null, 'Purchase order deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Purchase order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only draft')) {
      return errorResponse(error.message, 400);
    }
    console.error('Delete purchase order error:', error);
    return serverErrorResponse(error.message || 'Failed to delete purchase order');
  }
}
