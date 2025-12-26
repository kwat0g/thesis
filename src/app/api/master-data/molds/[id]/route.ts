import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as moldRepository from '@/lib/repositories/master-data/moldRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_MOLDS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid mold ID', 400);

    const mold = await moldRepository.findById(id);
    if (!mold) return notFoundResponse('Mold not found');

    return successResponse(mold);
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get mold error:', error);
    return serverErrorResponse('Failed to retrieve mold');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_MOLDS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid mold ID', 400);

    const body = await request.json();
    const { moldName, moldType, cavityCount, status, totalShots, maxShots } = body;

    const existing = await moldRepository.findById(id);
    if (!existing) return notFoundResponse('Mold not found');

    const success = await moldRepository.update(id, {
      moldName: moldName?.trim(),
      moldType,
      cavityCount,
      status,
      totalShots,
      maxShots,
      updatedBy: user.userId,
    });

    if (success) {
      await auditLogRepository.create({
        userId: user.userId,
        action: 'UPDATE',
        module: 'MASTER_DATA',
        recordType: 'mold',
        recordId: id,
        oldValues: { moldName: existing.moldName, status: existing.status, totalShots: existing.totalShots },
        newValues: { moldName, status, totalShots },
      });
    }

    const mold = await moldRepository.findById(id);
    return successResponse(mold, 'Mold updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Update mold error:', error);
    return serverErrorResponse(error.message || 'Failed to update mold');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_MOLDS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid mold ID', 400);

    const existing = await moldRepository.findById(id);
    if (!existing) return notFoundResponse('Mold not found');

    const success = await moldRepository.deleteMold(id);

    if (success) {
      await auditLogRepository.create({
        userId: user.userId,
        action: 'DELETE',
        module: 'MASTER_DATA',
        recordType: 'mold',
        recordId: id,
        oldValues: { moldCode: existing.moldCode, moldName: existing.moldName },
      });
    }

    return successResponse(null, 'Mold deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Delete mold error:', error);
    return serverErrorResponse(error.message || 'Failed to delete mold');
  }
}
