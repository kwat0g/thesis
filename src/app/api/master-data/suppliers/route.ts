import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as supplierService from '@/lib/services/master-data/supplierService';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_SUPPLIERS');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;

    const result = await supplierService.getSuppliersPaginated(page, pageSize, isActive);
    return successResponse(result.data, undefined, result.meta);
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get suppliers error:', error);
    return serverErrorResponse('Failed to retrieve suppliers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_SUPPLIERS');

    const body = await request.json();
    const { supplierCode, supplierName, contactPerson, email, phone, address, paymentTerms } = body;

    if (!supplierCode || !supplierName) {
      return errorResponse('Supplier code and name are required', 400);
    }

    const supplierId = await supplierService.createSupplier(
      { supplierCode, supplierName, contactPerson, email, phone, address, paymentTerms },
      user.userId
    );

    const supplier = await supplierService.getSupplierById(supplierId);
    return successResponse(supplier, 'Supplier created successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    if (error.message.includes('already exists')) return errorResponse(error.message, 409);
    console.error('Create supplier error:', error);
    return serverErrorResponse(error.message || 'Failed to create supplier');
  }
}

