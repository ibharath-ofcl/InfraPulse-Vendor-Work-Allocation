import { AuthUser, Permission } from '../types';
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
}
