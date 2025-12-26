import { BaseEntity } from './common';

export interface User extends BaseEntity {
  username: string;
  email: string;
  passwordHash: string;
  employeeId?: number;
  isActive: boolean;
  lastLogin?: Date;
}

export interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  module: string;
  description?: string;
  createdAt: Date;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  assignedAt: Date;
  assignedBy?: number;
}

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  module: string;
  recordType: string;
  recordId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export interface AuthContext {
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
