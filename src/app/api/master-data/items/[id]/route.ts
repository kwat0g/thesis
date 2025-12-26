import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as itemService from '@/lib/services/master-data/itemService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.VIEW_ITEMS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid item ID', 400);
    }

    const item = await itemService.getItemById(id);

    if (!item) {
      return notFoundResponse('Item not found');
    }

    return successResponse(item);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get item error:', error);
    return serverErrorResponse('Failed to retrieve item');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_ITEMS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid item ID', 400);
    }

    const body = await request.json();
    const { 
      itemName, 
      description, 
      itemType, 
      uomId, 
      reorderLevel, 
      reorderQuantity, 
      unitCost 
    } = body;

    const success = await itemService.updateItem(
      id,
      {
        itemName,
        description,
        itemType,
        uomId,
        reorderLevel,
        reorderQuantity,
        unitCost,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('Item not found');
    }

    const item = await itemService.getItemById(id);

    return successResponse(item, 'Item updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Item not found') {
      return notFoundResponse(error.message);
    }
    console.error('Update item error:', error);
    return serverErrorResponse(error.message || 'Failed to update item');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_ITEMS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid item ID', 400);
    }

    const success = await itemService.deleteItem(id, user.userId);

    if (!success) {
      return notFoundResponse('Item not found');
    }

    return successResponse(null, 'Item deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Item not found') {
      return notFoundResponse(error.message);
    }
    console.error('Delete item error:', error);
    return serverErrorResponse(error.message || 'Failed to delete item');
  }
}
