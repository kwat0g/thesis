import { NextRequest } from 'next/server';
import * as authService from '@/lib/services/auth/authService';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/utils/response';
import { getClientInfo } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    const { ipAddress, userAgent } = getClientInfo(request);

    const result = await authService.login(username, password, ipAddress, userAgent);

    if (!result) {
      return errorResponse('Invalid username or password', 401);
    }

    return successResponse(result, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return serverErrorResponse('An error occurred during login');
  }
}

