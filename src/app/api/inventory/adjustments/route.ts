import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as inventoryAdjustmentService from '@/lib/services/inventory/inventoryAdjustmentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.ADJUST_INVENTORY');

    const body = await request.json();
    const { itemId, warehouseId, adjustmentType, quantity, reason, notes } = body;

    if (!itemId || !warehouseId || !adjustmentType || quantity === undefined || !reason) {
      return errorResponse('Item, warehouse, adjustment type, quantity, and reason are required', 400);
    }

    const success = await inventoryAdjustmentService.adjustInventory(
      {
        itemId,
        warehouseId,
        adjustmentType,
        quantity: parseFloat(quantity),
        reason,
        notes,
      },
      user.userId
    );

    if (!success) {
      return errorResponse('Failed to adjust inventory', 500);
    }

    const balance = await inventoryAdjustmentService.getInventoryBalance(itemId, warehouseId);

    return successResponse(balance, 'Inventory adjusted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Adjust inventory error:', error);
    return serverErrorResponse(error.message || 'Failed to adjust inventory');
  }
}

