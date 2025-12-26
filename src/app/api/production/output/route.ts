import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as productionOutputService from '@/lib/services/production/productionOutputService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PROD.RECORD_OUTPUT');

    const body = await request.json();
    const { 
      workOrderId, 
      operatorId, 
      outputDate, 
      quantityGood, 
      quantityScrap, 
      quantityRework, 
      warehouseId,
      shiftId, 
      notes 
    } = body;

    if (!workOrderId || !operatorId || !outputDate || !warehouseId ||
        quantityGood === undefined || quantityScrap === undefined || quantityRework === undefined) {
      return errorResponse('Work order, operator, date, warehouse, and quantities are required', 400);
    }

    const outputId = await productionOutputService.recordProductionOutput(
      {
        workOrderId,
        operatorId,
        outputDate: new Date(outputDate),
        quantityGood: parseFloat(quantityGood),
        quantityScrap: parseFloat(quantityScrap),
        quantityRework: parseFloat(quantityRework),
        warehouseId,
        shiftId,
        notes,
      },
      user.userId
    );

    const output = await productionOutputService.getOutputById(outputId);

    return successResponse(output, 'Production output recorded successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Record production output error:', error);
    return serverErrorResponse(error.message || 'Failed to record production output');
  }
}

