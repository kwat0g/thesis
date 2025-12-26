import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as userRepository from '@/lib/repositories/auth/userRepository';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const userData = await userRepository.findById(user.userId);
    if (!userData) {
      return errorResponse('User not found', 404);
    }

    const roles = await userRepository.getUserRoles(user.userId);
    const permissions = await userRepository.getUserPermissions(user.userId);

    return successResponse({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      employeeId: userData.employeeId,
      roles,
      permissions,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return unauthorizedResponse();
    }
    console.error('Get user error:', error);
    return serverErrorResponse('An error occurred while fetching user data');
  }
}

