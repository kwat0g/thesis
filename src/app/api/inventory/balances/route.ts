import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as inventoryAdjustmentService from '@/lib/services/inventory/inventoryAdjustmentService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'INV.VIEW_BALANCES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const itemId = searchParams.get('itemId');
    const warehouseId = searchParams.get('warehouseId');

    const filters = {
      itemId: itemId ? parseInt(itemId) : undefined,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
    };

    const result = await inventoryAdjustmentService.getInventoryBalancesPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get inventory balances error:', error);
    return serverErrorResponse('Failed to retrieve inventory balances');
  }
}

