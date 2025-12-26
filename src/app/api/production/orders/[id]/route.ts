import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionOrderService from '@/lib/services/production/productionOrderService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.VIEW_ORDERS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid production order ID', 400);
    }

    const productionOrder = await productionOrderService.getProductionOrderById(id);

    if (!productionOrder) {
      return notFoundResponse('Production order not found');
    }

    return successResponse(productionOrder);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get production order error:', error);
    return serverErrorResponse('Failed to retrieve production order');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.UPDATE_ORDER');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid production order ID', 400);
    }

    const body = await request.json();
    const { 
      customerPoReference, 
      itemId, 
      quantityOrdered, 
      requiredDate, 
      priority, 
      notes 
    } = body;

    const success = await productionOrderService.updateProductionOrder(
      id,
      {
        customerPoReference,
        itemId,
        quantityOrdered: quantityOrdered ? parseFloat(quantityOrdered) : undefined,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
        priority,
        notes,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('Production order not found');
    }

    const productionOrder = await productionOrderService.getProductionOrderById(id);

    return successResponse(productionOrder, 'Production order updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Production order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only draft')) {
      return errorResponse(error.message, 400);
    }
    console.error('Update production order error:', error);
    return serverErrorResponse(error.message || 'Failed to update production order');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.DELETE_ORDER');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid production order ID', 400);
    }

    const success = await productionOrderService.deleteProductionOrder(id, user.userId);

    if (!success) {
      return notFoundResponse('Production order not found');
    }

    return successResponse(null, 'Production order deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Production order not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only draft')) {
      return errorResponse(error.message, 400);
    }
    console.error('Delete production order error:', error);
    return serverErrorResponse(error.message || 'Failed to delete production order');
  }
}
