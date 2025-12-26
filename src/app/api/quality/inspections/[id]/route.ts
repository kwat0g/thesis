import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as incomingInspectionService from '@/lib/services/quality/incomingInspectionService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.VIEW_INSPECTIONS');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid inspection ID', 400);
    }

    const inspection = await incomingInspectionService.getInspectionById(id);

    if (!inspection) {
      return notFoundResponse('Inspection not found');
    }

    return successResponse(inspection);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get inspection error:', error);
    return serverErrorResponse('Failed to retrieve inspection');
  }
}
