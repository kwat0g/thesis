import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionOrderService from '@/lib/services/production/productionOrderService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.VIEW_ORDERS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const itemId = searchParams.get('itemId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      status: status || undefined,
      priority: priority || undefined,
      itemId: itemId ? parseInt(itemId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await productionOrderService.getProductionOrdersPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get production orders error:', error);
    return serverErrorResponse('Failed to retrieve production orders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.CREATE_ORDER');

    const body = await request.json();
    const { 
      poNumber, 
      customerPoReference, 
      itemId, 
      quantityOrdered, 
      requiredDate, 
      priority, 
      notes,
      submitForApproval 
    } = body;

    if (!poNumber || !itemId || !quantityOrdered || !requiredDate) {
      return errorResponse('PO number, item, quantity, and required date are required', 400);
    }

    const poId = await productionOrderService.createProductionOrder(
      {
        poNumber,
        customerPoReference,
        itemId,
        quantityOrdered: parseFloat(quantityOrdered),
        requiredDate: new Date(requiredDate),
        priority,
        notes,
        submitForApproval: submitForApproval === true,
      },
      user.userId
    );

    const productionOrder = await productionOrderService.getProductionOrderById(poId);

    return successResponse(productionOrder, 'Production order created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message.includes('already exists')) {
      return errorResponse(error.message, 409);
    }
    console.error('Create production order error:', error);
    return serverErrorResponse(error.message || 'Failed to create production order');
  }
}

