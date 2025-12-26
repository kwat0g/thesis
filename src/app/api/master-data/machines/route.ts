import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as machineRepository from '@/lib/repositories/master-data/machineRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_MACHINES');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const status = searchParams.get('status');

    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
    const filters = { isActive, status: status || undefined };

    const { data, total } = await machineRepository.findPaginated(page, pageSize, filters);
    return successResponse(data, undefined, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get machines error:', error);
    return serverErrorResponse('Failed to retrieve machines');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_MACHINES');

    const body = await request.json();
    const { machineCode, machineName, machineType, departmentId, capacityPerHour, status } = body;

    if (!machineCode || !machineName) {
      return errorResponse('Machine code and name are required', 400);
    }

    const existing = await machineRepository.findByCode(machineCode);
    if (existing) {
      return errorResponse(`Machine code '${machineCode}' already exists`, 409);
    }

    const machineId = await machineRepository.create({
      machineCode: machineCode.trim().toUpperCase(),
      machineName: machineName.trim(),
      machineType,
      departmentId,
      capacityPerHour,
      status,
      createdBy: user.userId,
    });

    await auditLogRepository.create({
      userId: user.userId,
      action: 'CREATE',
      module: 'MASTER_DATA',
      recordType: 'machine',
      recordId: machineId,
      newValues: { machineCode, machineName },
    });

    const machine = await machineRepository.findById(machineId);
    return successResponse(machine, 'Machine created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Create machine error:', error);
    return serverErrorResponse(error.message || 'Failed to create machine');
  }
}

