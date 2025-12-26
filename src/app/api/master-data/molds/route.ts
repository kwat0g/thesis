import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldRepository from '@/lib/repositories/master-data/moldRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_MOLDS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const status = searchParams.get('status');

    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
    const filters = { isActive, status: status || undefined };

    const { data, total } = await moldRepository.findPaginated(page, pageSize, filters);
    return successResponse(data, undefined, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get molds error:', error);
    return serverErrorResponse('Failed to retrieve molds');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_MOLDS');

    const body = await request.json();
    const { moldCode, moldName, moldType, cavityCount, status, totalShots, maxShots } = body;

    if (!moldCode || !moldName) {
      return errorResponse('Mold code and name are required', 400);
    }

    const existing = await moldRepository.findByCode(moldCode);
    if (existing) {
      return errorResponse(`Mold code '${moldCode}' already exists`, 409);
    }

    const moldId = await moldRepository.create({
      moldCode: moldCode.trim().toUpperCase(),
      moldName: moldName.trim(),
      moldType,
      cavityCount,
      status,
      totalShots,
      maxShots,
      createdBy: user.userId,
    });

    await auditLogRepository.create({
      userId: user.userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordType: 'mold',
      recordId: moldId,
      newValues: { moldCode, moldName },
    });

    const mold = await moldRepository.findById(moldId);
    return successResponse(mold, 'Mold created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Create mold error:', error);
    return serverErrorResponse(error.message || 'Failed to create mold');
  }
}

