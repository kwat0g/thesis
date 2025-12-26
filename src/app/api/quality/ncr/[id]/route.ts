import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as ncrService from '@/lib/services/quality/ncrService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.VIEW_NCR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid NCR ID', 400);
    }

    const ncr = await ncrService.getNCRById(id);

    if (!ncr) {
      return notFoundResponse('NCR not found');
    }

    return successResponse(ncr);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get NCR error:', error);
    return serverErrorResponse('Failed to retrieve NCR');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.UPDATE_NCR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid NCR ID', 400);
    }

    const body = await request.json();
    const { rootCause, correctiveAction, notes } = body;

    const success = await ncrService.updateNCR(
      id,
      {
        rootCause,
        correctiveAction,
        notes,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('NCR not found');
    }

    const ncr = await ncrService.getNCRById(id);

    return successResponse(ncr, 'NCR updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'NCR not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Cannot update')) {
      return errorResponse(error.message, 400);
    }
    console.error('Update NCR error:', error);
    return serverErrorResponse(error.message || 'Failed to update NCR');
  }
}
