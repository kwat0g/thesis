import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as uomRepository from '@/lib/repositories/master-data/uomRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_ITEMS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const { data, total } = await uomRepository.findPaginated(page, pageSize, isActive);
    return successResponse(data, undefined, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get UOM error:', error);
    return serverErrorResponse('Failed to retrieve units of measure');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_ITEMS');

    const body = await request.json();
    const { uomCode, uomName, description } = body;

    if (!uomCode || !uomName) {
      return errorResponse('UOM code and name are required', 400);
    }

    const existing = await uomRepository.findByCode(uomCode);
    if (existing) {
      return errorResponse(`UOM code '${uomCode}' already exists`, 409);
    }

    const uomId = await uomRepository.create({
      uomCode: uomCode.trim().toUpperCase(),
      uomName: uomName.trim(),
      description: description?.trim(),
    });

    await auditLogRepository.create({
      userId: user.userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordType: 'uom',
      recordId: uomId,
      newValues: { uomCode, uomName },
    });

    const uom = await uomRepository.findById(uomId);
    return successResponse(uom, 'Unit of measure created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Create UOM error:', error);
    return serverErrorResponse(error.message || 'Failed to create unit of measure');
  }
}

