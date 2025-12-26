import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as machineRepository from '@/lib/repositories/master-data/machineRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_MACHINES');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid machine ID', 400);

    const machine = await machineRepository.findById(id);
    if (!machine) return notFoundResponse('Machine not found');

    return successResponse(machine);
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get machine error:', error);
    return serverErrorResponse('Failed to retrieve machine');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_MACHINES');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid machine ID', 400);

    const body = await request.json();
    const { machineName, machineType, departmentId, capacityPerHour, status } = body;

    const existing = await machineRepository.findById(id);
    if (!existing) return notFoundResponse('Machine not found');

    const success = await machineRepository.update(id, {
      machineName: machineName?.trim(),
      machineType,
      departmentId,
      capacityPerHour,
      status,
      updatedBy: user.userId,
    });

    if (success) {
      await auditLogRepository.create({
        userId: user.userId,
        action: 'UPDATE',
        module: 'MASTER_DATA',
        recordType: 'machine',
        recordId: id,
        oldValues: { machineName: existing.machineName, status: existing.status },
        newValues: { machineName, status },
      });
    }

    const machine = await machineRepository.findById(id);
    return successResponse(machine, 'Machine updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Update machine error:', error);
    return serverErrorResponse(error.message || 'Failed to update machine');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_MACHINES');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid machine ID', 400);

    const existing = await machineRepository.findById(id);
    if (!existing) return notFoundResponse('Machine not found');

    const success = await machineRepository.deleteMachine(id);

    if (success) {
      await auditLogRepository.create({
        userId: user.userId,
        action: 'DELETE',
        module: 'MASTER_DATA',
        recordType: 'machine',
        recordId: id,
        oldValues: { machineCode: existing.machineCode, machineName: existing.machineName },
      });
    }

    return successResponse(null, 'Machine deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Delete machine error:', error);
    return serverErrorResponse(error.message || 'Failed to delete machine');
  }
}
