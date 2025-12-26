import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as incomingInspectionService from '@/lib/services/quality/incomingInspectionService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.VIEW_INSPECTIONS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const inspectionType = searchParams.get('inspectionType');
    const status = searchParams.get('status');
    const result = searchParams.get('result');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      inspectionType: inspectionType || undefined,
      status: status || undefined,
      result: result || undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const resultData = await incomingInspectionService.getInspectionsPaginated(page, pageSize, filters);

    return successResponse(resultData.data, undefined, resultData.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get inspections error:', error);
    return serverErrorResponse('Failed to retrieve inspections');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.CREATE_INSPECTION');

    const body = await request.json();
    const { 
      inspectionType, 
      goodsReceiptId, 
      productionOrderId, 
      inspectionDate, 
      inspectorId, 
      itemId, 
      quantityInspected, 
      quantityPassed, 
      quantityFailed, 
      notes 
    } = body;

    if (!inspectionType || !inspectionDate || !inspectorId || !itemId || 
        quantityInspected === undefined || quantityPassed === undefined || quantityFailed === undefined) {
      return errorResponse('Inspection type, date, inspector, item, and quantities are required', 400);
    }

    let inspectionId: number;

    if (inspectionType === 'incoming') {
      if (!goodsReceiptId) {
        return errorResponse('Goods receipt ID is required for incoming inspection', 400);
      }

      inspectionId = await incomingInspectionService.createIncomingInspection(
        {
          goodsReceiptId,
          inspectionDate: new Date(inspectionDate),
          inspectorId,
          itemId,
          quantityInspected: parseFloat(quantityInspected),
          quantityPassed: parseFloat(quantityPassed),
          quantityFailed: parseFloat(quantityFailed),
          notes,
        },
        user.userId
      );
    } else if (inspectionType === 'in_process') {
      if (!productionOrderId) {
        return errorResponse('Production order ID is required for in-process inspection', 400);
      }

      inspectionId = await incomingInspectionService.createInProcessInspection(
        {
          productionOrderId,
          inspectionDate: new Date(inspectionDate),
          inspectorId,
          itemId,
          quantityInspected: parseFloat(quantityInspected),
          quantityPassed: parseFloat(quantityPassed),
          quantityFailed: parseFloat(quantityFailed),
          notes,
        },
        user.userId
      );
    } else {
      return errorResponse('Invalid inspection type. Must be "incoming" or "in_process"', 400);
    }

    const inspection = await incomingInspectionService.getInspectionById(inspectionId);

    return successResponse(inspection, 'Inspection created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create inspection error:', error);
    return serverErrorResponse(error.message || 'Failed to create inspection');
  }
}

