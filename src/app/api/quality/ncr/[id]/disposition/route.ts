import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as ncrService from '@/lib/services/quality/ncrService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'QC.MANAGE_NCR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid NCR ID', 400);
    }

    const body = await request.json();
    const { disposition } = body;

    if (!disposition) {
      return errorResponse('Disposition is required', 400);
    }

    if (!['rework', 'scrap', 'use_as_is', 'return_to_supplier'].includes(disposition)) {
      return errorResponse('Invalid disposition. Must be: rework, scrap, use_as_is, or return_to_supplier', 400);
    }

    const success = await ncrService.setNCRDisposition(id, disposition, user.userId);

    if (!success) {
      return notFoundResponse('NCR not found');
    }

    const ncr = await ncrService.getNCRById(id);

    return successResponse(ncr, `NCR disposition set to ${disposition}`);
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
    if (error.message.includes('Cannot change')) {
      return errorResponse(error.message, 400);
    }
    console.error('Set NCR disposition error:', error);
    return serverErrorResponse(error.message || 'Failed to set NCR disposition');
  }
}
