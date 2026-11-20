import { AuthUser, Permission, UserRole } from '../types';
import { LoginPayload } from '../services/authService';

export interface AuthContextType {
  user: AuthUser | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  updateUser: (updated: Partial<AuthUser>) => void;
  switchRole: (role: UserRole, customName?: string, customEmail?: string) => void;
}
