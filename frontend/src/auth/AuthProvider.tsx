import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { AuthUser, Permission } from '../types';
import { authService, LoginPayload } from '../services/authService';
import { setInMemoryToken } from '../services/api';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silently restore session via HttpOnly refresh cookie on application startup
  const restoreSession = useCallback(async () => {
    try {
      const authData = await authService.refresh();
      setUser(authData.user);
      setPermissions(authData.permissions);
      return true;
    } catch {
      setUser(null);
      setPermissions([]);
      setInMemoryToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen for 401 session expiration from Axios response interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setPermissions([]);
      setInMemoryToken(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [restoreSession]);

  const login = async (credentials: LoginPayload): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const authData = await authService.login(credentials);
      setUser(authData.user);
      setPermissions(authData.permissions);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setPermissions([]);
      setInMemoryToken(null);
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession: restoreSession,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
