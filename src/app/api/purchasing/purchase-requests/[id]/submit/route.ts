import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as purchaseRequestService from '@/lib/services/purchasing/purchaseRequestService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.CREATE_PR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase request ID', 400);
    }

    const success = await purchaseRequestService.submitPRForApproval(id, user.userId);

    if (!success) {
      return notFoundResponse('Purchase request not found');
    }

    const pr = await purchaseRequestService.getPRById(id);

    return successResponse(pr, 'Purchase request submitted for approval');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message === 'Purchase request not found') {
      return notFoundResponse(error.message);
    }
    if (error.message.includes('Only draft') || error.message.includes('Cannot submit')) {
      return errorResponse(error.message, 400);
    }
    console.error('Submit purchase request error:', error);
    return serverErrorResponse(error.message || 'Failed to submit purchase request');
  }
}
