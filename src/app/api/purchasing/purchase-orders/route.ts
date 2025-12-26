import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as purchaseOrderService from '@/lib/services/purchasing/purchaseOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.VIEW_PO');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');
    const supplierId = searchParams.get('supplierId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      status: status || undefined,
      approvalStatus: approvalStatus || undefined,
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await purchaseOrderService.getPOsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get purchase orders error:', error);
    return serverErrorResponse('Failed to retrieve purchase orders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.CREATE_PO');

    const body = await request.json();
    const { prId, supplierId, orderDate, expectedDeliveryDate, lines, notes, submitForApproval } = body;

    if (!supplierId || !orderDate || !expectedDeliveryDate || !lines) {
      return errorResponse('Supplier, order date, expected delivery date, and lines are required', 400);
    }

    let poId: number;

    if (prId) {
      poId = await purchaseOrderService.createPOFromPR(
        prId,
        {
          supplierId,
          orderDate: new Date(orderDate),
          expectedDeliveryDate: new Date(expectedDeliveryDate),
          lines,
          notes,
          submitForApproval: submitForApproval === true,
        },
        user.userId
      );
    } else {
      poId = await purchaseOrderService.createPO(
        {
          supplierId,
          orderDate: new Date(orderDate),
          expectedDeliveryDate: new Date(expectedDeliveryDate),
          lines,
          notes,
          submitForApproval: submitForApproval === true,
        },
        user.userId
      );
    }

    const po = await purchaseOrderService.getPOById(poId);

    return successResponse(po, 'Purchase order created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create purchase order error:', error);
    return serverErrorResponse(error.message || 'Failed to create purchase order');
  }
}

