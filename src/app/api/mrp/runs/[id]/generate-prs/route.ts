import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as prGenerationService from '@/lib/services/mrp/prGenerationService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    await requirePermission(user, 'MRP.EXECUTE_MRP');

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid MRP run ID', 400);
    }

    const prResults = await prGenerationService.generatePRsFromMRP(id, user.userId);

    return successResponse(prResults, `Generated ${prResults.length} purchase requests from MRP shortages`);
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) {
      return errorResponse(error.message, 403);
    }
    if (error.message.includes('No shortages')) {
      return errorResponse(error.message, 400);
    }
    console.error('Generate PRs from MRP error:', error);
    return serverErrorResponse(error.message || 'Failed to generate purchase requests');
  }
}
