import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as itemService from '@/lib/services/master-data/itemService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.VIEW_ITEMS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const itemType = searchParams.get('itemType');

    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const filters = {
      isActive,
      itemType: itemType || undefined,
    };

    const result = await itemService.getItemsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get items error:', error);
    return serverErrorResponse('Failed to retrieve items');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MASTER.MANAGE_ITEMS');

    const body = await request.json();
    const { 
      itemCode, 
      itemName, 
      description, 
      itemType, 
      uomId, 
      reorderLevel, 
      reorderQuantity, 
      unitCost 
    } = body;

    if (!itemCode || !itemName || !itemType || !uomId) {
      return errorResponse('Item code, name, type, and unit of measure are required', 400);
    }

    const itemId = await itemService.createItem(
      {
        itemCode,
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

    const item = await itemService.getItemById(itemId);

    return successResponse(item, 'Item created successfully');
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
    console.error('Create item error:', error);
    return serverErrorResponse(error.message || 'Failed to create item');
  }
}

