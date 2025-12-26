import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as purchaseRequestService from '@/lib/services/purchasing/purchaseRequestService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.VIEW_PR');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');
    const requestorId = searchParams.get('requestorId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filters = {
      status: status || undefined,
      approvalStatus: approvalStatus || undefined,
      requestorId: requestorId ? parseInt(requestorId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const result = await purchaseRequestService.getPRsPaginated(page, pageSize, filters);

    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Get purchase requests error:', error);
    return serverErrorResponse('Failed to retrieve purchase requests');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'PURCH.CREATE_PR');

    const body = await request.json();
    const { requestDate, requiredDate, requestorId, justification, lines, submitForApproval } = body;

    if (!requestDate || !requiredDate || !requestorId || !lines) {
      return errorResponse('Request date, required date, requestor, and lines are required', 400);
    }

    const prId = await purchaseRequestService.createPR(
      {
        requestDate: new Date(requestDate),
        requiredDate: new Date(requiredDate),
        requestorId,
        justification,
        lines,
        submitForApproval: submitForApproval === true,
      },
      user.userId
    );

    const pr = await purchaseRequestService.getPRById(prId);

    return successResponse(pr, 'Purchase request created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    console.error('Create purchase request error:', error);
    return serverErrorResponse(error.message || 'Failed to create purchase request');
  }
}

