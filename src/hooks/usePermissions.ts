'use client';

import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.every((p) => user.permissions.includes(p));
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    permissions: user?.permissions || [],
    roles: user?.roles || [],
  };
};
