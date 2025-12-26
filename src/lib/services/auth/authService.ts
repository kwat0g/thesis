import * as userRepository from '@/lib/repositories/auth/userRepository';
import * as auditLogRepository from '@/lib/repositories/auth/auditLogRepository';
import { hashPassword, comparePassword } from '@/lib/utils/bcrypt';
import { signToken, JWTPayload } from '@/lib/utils/jwt';
import { LoginResponse } from '@/lib/types/auth';

export const login = async (
  username: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResponse | null> => {
  const user = await userRepository.findByUsername(username);
  
  if (!user || !user.isActive) {
    await auditLogRepository.create({
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      recordType: 'user',
      ipAddress,
      userAgent,
    });
    return null;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  
  if (!isPasswordValid) {
    await auditLogRepository.create({
      userId: user.id,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      recordType: 'user',
      recordId: user.id,
      ipAddress,
      userAgent,
    });
    return null;
  }

  const roles = await userRepository.getUserRoles(user.id);
  const permissions = await userRepository.getUserPermissions(user.id);

  await userRepository.updateLastLogin(user.id);

  await auditLogRepository.create({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    module: 'AUTH',
    recordType: 'user',
    recordId: user.id,
    ipAddress,
    userAgent,
  });

  const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    id: user.id,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: roles[0] || 'user',
    roles: roles,
    permissions: permissions,
  };

  const token = signToken(tokenPayload);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
    },
  };
};

export const createUser = async (data: {
  username: string;
  email: string;
  password: string;
  employeeId?: number;
  createdBy?: number;
}): Promise<number> => {
  const existingUser = await userRepository.findByUsername(data.username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const existingEmail = await userRepository.findByEmail(data.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const userId = await userRepository.create({
    username: data.username,
    email: data.email,
    passwordHash,
    employeeId: data.employeeId,
    createdBy: data.createdBy,
  });

  await auditLogRepository.create({
    userId: data.createdBy,
    action: 'CREATE',
    module: 'AUTH',
    recordType: 'user',
    recordId: userId,
    newValues: {
      username: data.username,
      email: data.email,
      employeeId: data.employeeId,
    },
  });

  return userId;
};

export const updateUserPassword = async (
  userId: number,
  newPassword: string,
  updatedBy?: number
): Promise<boolean> => {
  const passwordHash = await hashPassword(newPassword);
  
  const success = await userRepository.update(userId, {
    passwordHash,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'UPDATE_PASSWORD',
      module: 'AUTH',
      recordType: 'user',
      recordId: userId,
    });
  }

  return success;
};

export const deactivateUser = async (
  userId: number,
  updatedBy?: number
): Promise<boolean> => {
  const success = await userRepository.update(userId, {
    isActive: false,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'DEACTIVATE',
      module: 'AUTH',
      recordType: 'user',
      recordId: userId,
    });
  }

  return success;
};

export const activateUser = async (
  userId: number,
  updatedBy?: number
): Promise<boolean> => {
  const success = await userRepository.update(userId, {
    isActive: true,
    updatedBy,
  });

  if (success) {
    await auditLogRepository.create({
      userId: updatedBy,
      action: 'ACTIVATE',
      module: 'AUTH',
      recordType: 'user',
      recordId: userId,
    });
  }

  return success;
};
