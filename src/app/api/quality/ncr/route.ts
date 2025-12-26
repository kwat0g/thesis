import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as ncrService from '@/lib/services/quality/ncrService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.VIEW_NCR');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const disposition = searchParams.get('disposition');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      disposition: disposition || undefined,
      status: status || undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await ncrService.getNCRsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get NCRs error:', error);
    return serverErrorResponse('Failed to retrieve NCRs');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.CREATE_NCR');

    const body = await request.json();
    const { 
      inspectionId, 
      ncrDate, 
      itemId, 
      quantityAffected, 
      defectDescription, 
      rootCause, 
      correctiveAction, 
      notes 
    } = body;

    if (!inspectionId || !ncrDate || !itemId || !quantityAffected || !defectDescription) {
      return errorResponse('Inspection, date, item, quantity, and defect description are required', 400);
    }

    const ncrId = await ncrService.createNCR(
      {
        inspectionId,
        ncrDate: new Date(ncrDate),
        itemId,
        quantityAffected: parseFloat(quantityAffected),
        defectDescription,
        rootCause,
        correctiveAction,
        notes,
      },
      user.userId
    );

    const ncr = await ncrService.getNCRById(ncrId);

    return successResponse(ncr, 'NCR created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create NCR error:', error);
    return serverErrorResponse(error.message || 'Failed to create NCR');
  }
}

