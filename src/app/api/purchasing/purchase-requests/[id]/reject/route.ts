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

    await requirePermission(user, 'PURCH.APPROVE_PR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase request ID', 400);
    }

    const body = await request.json();
    const { reason } = body;

    const success = await purchaseRequestService.rejectPR(id, user.userId, reason);

    if (!success) {
      return notFoundResponse('Purchase request not found');
    }

    const pr = await purchaseRequestService.getPRById(id);

    return successResponse(pr, 'Purchase request rejected');
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
    if (error.message.includes('Only pending') || error.message.includes('Cannot reject')) {
      return errorResponse(error.message, 400);
    }
    console.error('Reject purchase request error:', error);
    return serverErrorResponse(error.message || 'Failed to reject purchase request');
  }
}
