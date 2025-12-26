import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/utils/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export const authenticate = (request: NextRequest): JWTPayload | null => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
};

export const requireAuth = (request: NextRequest): JWTPayload => {
  const user = authenticate(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
};

export const getClientInfo = (request: NextRequest) => {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
};
