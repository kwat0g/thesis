import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as purchaseRequestService from '@/lib/services/purchasing/purchaseRequestService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.VIEW_PR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase request ID', 400);
    }

    const pr = await purchaseRequestService.getPRById(id);

    if (!pr) {
      return notFoundResponse('Purchase request not found');
    }

    const lines = await purchaseRequestService.getPRLines(id);

    return successResponse({ ...pr, lines });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get purchase request error:', error);
    return serverErrorResponse('Failed to retrieve purchase request');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.UPDATE_PR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase request ID', 400);
    }

    const body = await request.json();
    const { requiredDate, justification } = body;

    const success = await purchaseRequestService.updatePR(
      id,
      {
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
        justification,
      },
      user.userId
    );

    if (!success) {
      return notFoundResponse('Purchase request not found');
    }

    const pr = await purchaseRequestService.getPRById(id);

    return successResponse(pr, 'Purchase request updated successfully');
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
    if (error.message.includes('Only draft')) {
      return errorResponse(error.message, 400);
    }
    console.error('Update purchase request error:', error);
    return serverErrorResponse(error.message || 'Failed to update purchase request');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.DELETE_PR');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid purchase request ID', 400);
    }

    const success = await purchaseRequestService.deletePR(id, user.userId);

    if (!success) {
      return notFoundResponse('Purchase request not found');
    }

    return successResponse(null, 'Purchase request deleted successfully');
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
    if (error.message.includes('Only draft')) {
      return errorResponse(error.message, 400);
    }
    console.error('Delete purchase request error:', error);
    return serverErrorResponse(error.message || 'Failed to delete purchase request');
  }
}
