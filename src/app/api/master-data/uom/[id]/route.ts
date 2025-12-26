import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as uomRepository from '@/lib/repositories/master-data/uomRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_ITEMS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid UOM ID', 400);

    const uom = await uomRepository.findById(id);
    if (!uom) return notFoundResponse('Unit of measure not found');

    return successResponse(uom);
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get UOM error:', error);
    return serverErrorResponse('Failed to retrieve unit of measure');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_ITEMS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid UOM ID', 400);

    const body = await request.json();
    const { uomName, description } = body;

    const existing = await uomRepository.findById(id);
    if (!existing) return notFoundResponse('Unit of measure not found');

    const success = await uomRepository.update(id, {
      uomName: uomName?.trim(),
      description: description?.trim(),
    });

    if (success) {
      await auditLogRepository.create({
        userId: user.userId,
        action: 'UPDATE',
        module: 'MASTER_DATA',
        recordType: 'uom',
        recordId: id,
        oldValues: { uomName: existing.uomName },
        newValues: { uomName },
      });
    }

    const uom = await uomRepository.findById(id);
    return successResponse(uom, 'Unit of measure updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Update UOM error:', error);
    return serverErrorResponse(error.message || 'Failed to update unit of measure');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_ITEMS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid UOM ID', 400);

    const existing = await uomRepository.findById(id);
    if (!existing) return notFoundResponse('Unit of measure not found');

    const success = await uomRepository.deleteUOM(id);

    if (success) {
      await auditLogRepository.create({
        userId: user.userId,
        action: 'DELETE',
        module: 'MASTER_DATA',
        recordType: 'uom',
        recordId: id,
        oldValues: { uomCode: existing.uomCode, uomName: existing.uomName },
      });
    }

    return successResponse(null, 'Unit of measure deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Delete UOM error:', error);
    return serverErrorResponse(error.message || 'Failed to delete unit of measure');
  }
}
