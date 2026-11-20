import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { AuthUser, Permission, UserRole } from '../types';
import { authService, LoginPayload, rolePermissionsMap } from '../services/authService';
import { setInMemoryToken } from '../services/api';

interface AuthProviderProps {
  children: React.ReactNode;
}

const DEFAULT_FIELD_OPERATOR: AuthUser = {
  id: 'usr-field_engineer',
  fullName: 'Kavita Reddy (Field QA)',
  email: 'field@infrapulse.gov.in',
  phoneNumber: '+91 80 2297 5000',
  department: 'Infrastructure Operations & Governance',
  dutyStation: 'Bengaluru Urban Corridor (HQ)',
  role: 'FIELD_ENGINEER',
  status: 'ACTIVE',
  lastLoginAt: '2026-11-20T04:06:38.000Z',
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silently restore session via HttpOnly refresh cookie or localStorage fallback
  const restoreSession = useCallback(async () => {
    try {
      const authData = await authService.refresh();
      setUser(authData.user);
      setPermissions(authData.permissions);
      return true;
    } catch {
      // Check stored custom profile
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('infrapulse_operator_profile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.user) {
              setUser(parsed.user);
              setPermissions(parsed.permissions || rolePermissionsMap[parsed.user.role as UserRole] || rolePermissionsMap.FIELD_ENGINEER);
              return true;
            }
          } catch (e) {
            console.error('Failed to parse stored operator profile', e);
          }
        }
      }

      // Default seed operator
      setUser(DEFAULT_FIELD_OPERATOR);
      setPermissions(rolePermissionsMap.FIELD_ENGINEER);
      return true;
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
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('infrapulse_operator_profile', JSON.stringify({
          user: authData.user,
          permissions: authData.permissions,
        }));
      }
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // offline logout
    } finally {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('infrapulse_operator_profile');
      }
      setUser(null);
      setPermissions([]);
      setInMemoryToken(null);
      setIsLoading(false);
    }
  };

  const updateUser = useCallback((updated: Partial<AuthUser>) => {
    setUser((prev) => {
      const current = prev || DEFAULT_FIELD_OPERATOR;
      const newUser: AuthUser = {
        ...current,
        ...updated,
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('infrapulse_operator_profile', JSON.stringify({
          user: newUser,
          permissions,
        }));
        window.dispatchEvent(new CustomEvent('infrapulse_operator_updated', { detail: newUser }));
      }

      return newUser;
    });
  }, [permissions]);

  const switchRole = useCallback((role: UserRole, customName?: string, customEmail?: string) => {
    const defaultRoster: Record<UserRole, { name: string; email: string; department: string; dutyStation: string; phone: string }> = {
      FIELD_ENGINEER: { 
        name: 'Kavita Reddy (Field QA)', 
        email: 'field@infrapulse.gov.in',
        department: 'Infrastructure Operations & Governance',
        dutyStation: 'Bengaluru Urban Corridor (HQ)',
        phone: '+91 80 2297 5000'
      },
      PLATFORM_ADMIN: { 
        name: 'Platform Administrator', 
        email: 'admin@infrapulse.gov.in',
        department: 'Platform Enterprise Governance & Architecture',
        dutyStation: 'Central Command Operations',
        phone: '+91 80 2297 5001'
      },
      PROJECT_MANAGER: { 
        name: 'Priya Sharma (PM)', 
        email: 'pm@infrapulse.gov.in',
        department: 'Municipal Urban Works & Project Management',
        dutyStation: 'Regional Infrastructure PMO',
        phone: '+91 80 2297 5002'
      },
      FINANCE_OFFICER: { 
        name: 'Rohan Mehta (Finance)', 
        email: 'finance@infrapulse.gov.in',
        department: 'Municipal Finance & Commercial Governance',
        dutyStation: 'Fiscal Oversight Directorate',
        phone: '+91 80 2297 5003'
      },
      VENDOR: { 
        name: 'Apex Infrastructure Ltd (Vendor)', 
        email: 'vendor@infrapulse.gov.in',
        department: 'Apex Infrastructure Prime Contracting Division',
        dutyStation: 'Field Operations Unit - East',
        phone: '+91 80 2297 5004'
      },
    };

    const target = defaultRoster[role] || { 
      name: 'Authorized Operator', 
      email: 'operator@infrapulse.gov.in',
      department: 'Infrastructure Operations & Governance',
      dutyStation: 'General Operations',
      phone: '+91 80 2297 5000'
    };
    const perms = rolePermissionsMap[role] || [];

    const newUser: AuthUser = {
      id: `usr-${role.toLowerCase()}`,
      fullName: customName || target.name,
      email: customEmail || target.email,
      phoneNumber: target.phone,
      department: target.department,
      dutyStation: target.dutyStation,
      role,
      status: 'ACTIVE',
      lastLoginAt: new Date().toISOString(),
    };

    setUser(newUser);
    setPermissions(perms);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('infrapulse_operator_profile', JSON.stringify({
        user: newUser,
        permissions: perms,
      }));
      window.dispatchEvent(new CustomEvent('infrapulse_operator_updated', { detail: newUser }));
    }
  }, []);

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
        updateUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};