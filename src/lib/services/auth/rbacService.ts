import * as userRepository from '@/lib/repositories/auth/userRepository';
import * as roleRepository from '@/lib/repositories/auth/roleRepository';

export const hasPermission = async (
  userId: number,
  permissionCode: string
): Promise<boolean> => {
  const permissions = await userRepository.getUserPermissions(userId);
  return permissions.includes(permissionCode);
};

export const hasRole = async (
  userId: number,
  roleCode: string
): Promise<boolean> => {
  const roles = await userRepository.getUserRoles(userId);
  return roles.includes(roleCode);
};

export const hasAnyRole = async (
  userId: number,
  roleCodes: string[]
): Promise<boolean> => {
  const roles = await userRepository.getUserRoles(userId);
  return roleCodes.some(roleCode => roles.includes(roleCode));
};

export const hasAllRoles = async (
  userId: number,
  roleCodes: string[]
): Promise<boolean> => {
  const roles = await userRepository.getUserRoles(userId);
  return roleCodes.every(roleCode => roles.includes(roleCode));
};

export const checkPermission = async (
  userId: number,
  permissionCode: string
): Promise<void> => {
  const hasAccess = await hasPermission(userId, permissionCode);
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permissionCode}`);
  }
};

export const checkRole = async (
  userId: number,
  roleCode: string
): Promise<void> => {
  const hasAccess = await hasRole(userId, roleCode);
  if (!hasAccess) {
    throw new Error(`Role required: ${roleCode}`);
  }
};
