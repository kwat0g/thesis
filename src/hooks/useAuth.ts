'use client';

import { useState, useEffect } from 'react';
import { getUser, isAuthenticated, logout as authLogout, AuthUser } from '@/services/api/auth';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUser();
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    authLogout();
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
};
