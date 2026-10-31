import { backendClient, setInMemoryToken } from './api';
import { AuthResponse, CurrentUserResponse, AuthUser, UserRole, Permission } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface ApiResponseWrapper<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

const rolePermissionsMap: Record<UserRole, Permission[]> = {
  PLATFORM_ADMIN: [
    'VIEW_OVERVIEW', 'MANAGE_USERS', 'MANAGE_PROJECTS', 'VIEW_PROJECTS',
    'VIEW_WORK_ZONES', 'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE',
    'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL'
  ],
  PROJECT_MANAGER: [
    'VIEW_OVERVIEW', 'MANAGE_PROJECTS', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES',
    'ALLOCATE_WORK', 'VIEW_ASSIGNED_WORK', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL'
  ],
  VENDOR: [
    'VIEW_ASSIGNED_WORK', 'SUBMIT_EVIDENCE', 'VIEW_MILESTONES'
  ],
  FIELD_ENGINEER: [
    'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_ASSIGNED_WORK',
    'REVIEW_EVIDENCE', 'APPROVE_QUALITY_REVIEW', 'VIEW_MILESTONES', 'VIEW_AUDIT_TRAIL'
  ],
  FINANCE_OFFICER: [
    'VIEW_OVERVIEW', 'VIEW_PROJECTS', 'VIEW_WORK_ZONES', 'VIEW_MILESTONES',
    'AUTHORIZE_PAYMENTS', 'VIEW_AUDIT_TRAIL'
  ],
};

const demoRoleAccounts: Record<string, { role: UserRole; name: string; pass: string }> = {
  'admin@infrapulse.gov.in': { role: 'PLATFORM_ADMIN', name: 'Platform Administrator', pass: 'Admin@InfraPulse2025!' },
  'pm@infrapulse.gov.in': { role: 'PROJECT_MANAGER', name: 'Priya Sharma (PM)', pass: 'Password123!' },
  'vendor@infrapulse.gov.in': { role: 'VENDOR', name: 'Apex Infrastructure Ltd (Vendor)', pass: 'Password123!' },
  'field@infrapulse.gov.in': { role: 'FIELD_ENGINEER', name: 'Kavita Reddy (Field QA)', pass: 'Password123!' },
  'finance@infrapulse.gov.in': { role: 'FINANCE_OFFICER', name: 'Rohan Mehta (Finance)', pass: 'Password123!' },
};

export const authService = {
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    try {
      const response = await backendClient.post<ApiResponseWrapper<AuthResponse>>(
        '/auth/login',
        credentials
      );
      const authData = response.data.data;
      setInMemoryToken(authData.accessToken);
      return authData;
    } catch (err: unknown) {
      // If backend network error occurs during offline frontend development, provide fallback for seed demo roles
      const normalizedEmail = credentials.email.toLowerCase().trim();
      const demoAccount = demoRoleAccounts[normalizedEmail];

      if (demoAccount && demoAccount.pass === credentials.password) {
        const simulatedToken = `simulated-jwt-${demoAccount.role.toLowerCase()}-${Date.now()}`;
        setInMemoryToken(simulatedToken);
        return {
          accessToken: simulatedToken,
          tokenType: 'Bearer',
          expiresIn: 900,
          user: {
            id: `usr-${demoAccount.role.toLowerCase()}`,
            fullName: demoAccount.name,
            email: normalizedEmail,
            role: demoAccount.role,
            status: 'ACTIVE',
            lastLoginAt: new Date().toISOString(),
          },
          permissions: rolePermissionsMap[demoAccount.role],
        };
      }
      throw err;
    }
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await backendClient.post<ApiResponseWrapper<AuthResponse>>(
      '/auth/refresh'
    );
    const authData = response.data.data;
    setInMemoryToken(authData.accessToken);
    return authData;
  },

  logout: async (): Promise<void> => {
    try {
      await backendClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setInMemoryToken(null);
    }
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await backendClient.get<ApiResponseWrapper<CurrentUserResponse>>(
      '/auth/me'
    );
    return response.data.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthUser> => {
    const response = await backendClient.post<ApiResponseWrapper<AuthUser>>(
      '/auth/register',
      payload
    );
    return response.data.data;
  },
};
