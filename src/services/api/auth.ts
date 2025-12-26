import { TOKEN_KEY, USER_KEY } from '@/utils/constants';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: AuthUser;
  };
  error?: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (data.success && data.data) {
    localStorage.setItem(TOKEN_KEY, data.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  }

  return data;
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasPermission = (permission: string): boolean => {
  const user = getUser();
  return user?.permissions.includes(permission) || false;
};

export const hasAnyPermission = (permissions: string[]): boolean => {
  const user = getUser();
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
};

export const hasRole = (role: string): boolean => {
  const user = getUser();
  return user?.roles.includes(role) || false;
};
