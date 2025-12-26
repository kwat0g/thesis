import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requirePermission } from '@/lib/middleware/rbac';
import * as supplierService from '@/lib/services/master-data/supplierService';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.VIEW_SUPPLIERS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid supplier ID', 400);

    const supplier = await supplierService.getSupplierById(id);
    if (!supplier) return notFoundResponse('Supplier not found');

    return successResponse(supplier);
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    console.error('Get supplier error:', error);
    return serverErrorResponse('Failed to retrieve supplier');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_SUPPLIERS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid supplier ID', 400);

    const body = await request.json();
    const { supplierName, contactPerson, email, phone, address, paymentTerms } = body;

    const success = await supplierService.updateSupplier(
      id,
      { supplierName, contactPerson, email, phone, address, paymentTerms },
      user.userId
    );

    if (!success) return notFoundResponse('Supplier not found');

    const supplier = await supplierService.getSupplierById(id);
    return successResponse(supplier, 'Supplier updated successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    if (error.message === 'Supplier not found') return notFoundResponse(error.message);
    console.error('Update supplier error:', error);
    return serverErrorResponse(error.message || 'Failed to update supplier');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await requirePermission(user, 'MASTER.MANAGE_SUPPLIERS');

    const id = parseInt(params.id);
    if (isNaN(id)) return errorResponse('Invalid supplier ID', 400);

    const success = await supplierService.deleteSupplier(id, user.userId);
    if (!success) return notFoundResponse('Supplier not found');

    return successResponse(null, 'Supplier deleted successfully');
  } catch (error: any) {
    if (error.message === 'Authentication required') return unauthorizedResponse();
    if (error.message.includes('Permission denied') || error.message.includes('Role required')) return errorResponse(error.message, 403);
    if (error.message === 'Supplier not found') return notFoundResponse(error.message);
    console.error('Delete supplier error:', error);
    return serverErrorResponse(error.message || 'Failed to delete supplier');
  }
}
