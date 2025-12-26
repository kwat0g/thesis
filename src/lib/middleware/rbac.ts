import { JWTPayload } from '@/lib/utils/jwt';
import * as rbacService from '@/lib/services/auth/rbacService';

export const requirePermission = async (
  user: JWTPayload,
  permissionCode: string
): Promise<void> => {
  await rbacService.checkPermission(user.userId, permissionCode);
};

export const requireRole = async (
  user: JWTPayload,
  roleCode: string
): Promise<void> => {
  await rbacService.checkRole(user.userId, roleCode);
};

export const requireAnyRole = async (
  user: JWTPayload,
  roleCodes: string[]
): Promise<void> => {
  const hasAccess = await rbacService.hasAnyRole(user.userId, roleCodes);
  if (!hasAccess) {
    throw new Error(`One of these roles required: ${roleCodes.join(', ')}`);
  }
};

export const requireAllRoles = async (
  user: JWTPayload,
  roleCodes: string[]
): Promise<void> => {
  const hasAccess = await rbacService.hasAllRoles(user.userId, roleCodes);
  if (!hasAccess) {
    throw new Error(`All of these roles required: ${roleCodes.join(', ')}`);
  }
};
