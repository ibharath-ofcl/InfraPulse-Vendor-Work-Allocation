import { backendClient } from './api';
import { AuthUser, CreateUserPayload, UpdateRolePayload, UpdateStatusPayload } from '../types';
import { ApiResponseWrapper } from './authService';

export const userService = {
  getUsers: async (): Promise<AuthUser[]> => {
    const response = await backendClient.get<ApiResponseWrapper<AuthUser[]>>('/users');
    return response.data.data;
  },

  getUserById: async (id: string): Promise<AuthUser> => {
    const response = await backendClient.get<ApiResponseWrapper<AuthUser>>(`/users/${id}`);
    return response.data.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<AuthUser> => {
    const response = await backendClient.post<ApiResponseWrapper<AuthUser>>('/users', payload);
    return response.data.data;
  },

  updateUserStatus: async (id: string, payload: UpdateStatusPayload): Promise<AuthUser> => {
    const response = await backendClient.patch<ApiResponseWrapper<AuthUser>>(`/users/${id}/status`, payload);
    return response.data.data;
  },

  updateUserRole: async (id: string, payload: UpdateRolePayload): Promise<AuthUser> => {
    const response = await backendClient.patch<ApiResponseWrapper<AuthUser>>(`/users/${id}/role`, payload);
    return response.data.data;
  },
};
